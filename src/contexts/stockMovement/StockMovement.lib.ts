import 'server-only';

import { db, type Tx } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { ProductType } from '@/contexts/product/Product.types';
import { products, productVariants } from '@/contexts/product/Products.table';
import { and, eq, gt, inArray, isNull, or, sum } from 'drizzle-orm';
import {
    freeStock,
    type ManualStockChange,
    mergeStockLines,
    type StockLine,
    StockMovementReason,
    type StockTarget,
    stockKey,
} from './StockMovement.types';
import {
    type NewStockMovementRecord,
    type NewStockReservationRecord,
    stockMovements,
    stockReservations,
} from './StockMovements.table';

interface OrderStockInput {
    orderId: string;
    projectId: string;
    createdBy: string | null;
}

async function lockStock(
    tx: Tx,
    target: StockTarget,
): Promise<
    { stock: number | null; type: ProductType; name: string } | undefined
> {
    if (target.variantId) {
        const [variant] = await tx
            .select({
                stock: productVariants.stock,
                type: products.type,
                name: products.name,
            })
            .from(productVariants)
            .innerJoin(products, eq(products.id, productVariants.productId))
            .where(
                and(
                    eq(productVariants.id, target.variantId),
                    eq(productVariants.productId, target.productId),
                    eq(productVariants.projectId, target.projectId),
                ),
            )
            .limit(1)
            .for('update', { of: productVariants });

        return variant;
    }

    const [product] = await tx
        .select({
            stock: products.stock,
            type: products.type,
            name: products.name,
        })
        .from(products)
        .where(
            and(
                eq(products.id, target.productId),
                eq(products.projectId, target.projectId),
                isNull(products.deletedAt),
            ),
        )
        .limit(1)
        .for('update');

    return product;
}

async function setStock(
    tx: Tx,
    target: StockTarget,
    stock: number | null,
): Promise<void> {
    if (target.variantId) {
        await tx
            .update(productVariants)
            .set({ stock })
            .where(eq(productVariants.id, target.variantId));

        return;
    }

    await tx
        .update(products)
        .set({ stock })
        .where(eq(products.id, target.productId));
}

async function writeOrderMovement(
    tx: Tx,
    input: OrderStockInput,
    line: StockTarget & Pick<NewStockMovementRecord, 'quantityDelta' | 'note'>,
    reason: StockMovementReason,
    stock: number | null,
): Promise<void> {
    if (line.quantityDelta === 0) return;

    const inserted = await tx
        .insert(stockMovements)
        .values({
            ...line,
            reason,
            orderId: input.orderId,
            createdBy: input.createdBy,
        })
        .onConflictDoNothing()
        .returning({ id: stockMovements.id });

    if (inserted.length === 0 || stock === null) return;

    await setStock(tx, line, stock + line.quantityDelta);
}

function activeReservation(now: Date) {
    return or(
        isNull(stockReservations.expiresAt),
        gt(stockReservations.expiresAt, now),
    );
}

async function reservedQuantity(tx: Tx, target: StockTarget): Promise<number> {
    const [row] = await tx
        .select({ reserved: sum(stockReservations.quantity).mapWith(Number) })
        .from(stockReservations)
        .where(
            and(
                eq(stockReservations.productId, target.productId),
                target.variantId
                    ? eq(stockReservations.variantId, target.variantId)
                    : isNull(stockReservations.variantId),
                activeReservation(new Date()),
            ),
        );

    return row?.reserved ?? 0;
}

async function releaseOrderStock(tx: Tx, orderId: string): Promise<void> {
    await tx
        .delete(stockReservations)
        .where(eq(stockReservations.orderId, orderId));
}

export async function reserveOrderStock(
    tx: Tx,
    input: Omit<OrderStockInput, 'createdBy'> & {
        lines: StockLine[];
        expiresAt: Date | null;
    },
): Promise<void> {
    const rows: NewStockReservationRecord[] = [];

    for (const line of mergeStockLines(input.lines)) {
        const target = { ...line, projectId: input.projectId };
        const current = await lockStock(tx, target);

        const free = freeStock(
            current?.stock ?? null,
            await reservedQuantity(tx, target),
        );

        if (!current || free === null) continue;

        if (free < line.quantity) {
            throw new ApplicationError(
                `Недостаточно «${current.name}» на складе: свободно ${free}`,
            );
        }

        rows.push({
            ...target,
            orderId: input.orderId,
            quantity: line.quantity,
            expiresAt: input.expiresAt,
        });
    }

    if (rows.length === 0) return;

    await tx.insert(stockReservations).values(rows);
}

export async function loadReservedStock(
    productIds: string[],
): Promise<Map<string, number>> {
    const rows = await db
        .select({
            productId: stockReservations.productId,
            variantId: stockReservations.variantId,
            reserved: sum(stockReservations.quantity).mapWith(Number),
        })
        .from(stockReservations)
        .where(
            and(
                inArray(stockReservations.productId, productIds),
                activeReservation(new Date()),
            ),
        )
        .groupBy(stockReservations.productId, stockReservations.variantId);

    return new Map(rows.map((row) => [stockKey(row), row.reserved]));
}

export async function applyStockSale(
    tx: Tx,
    input: OrderStockInput & { lines: StockLine[] },
): Promise<void> {
    for (const line of mergeStockLines(input.lines)) {
        const target = { ...line, projectId: input.projectId };
        const current = await lockStock(tx, target);

        if (!current) continue;

        const sold =
            current.stock === null
                ? line.quantity
                : Math.min(line.quantity, current.stock);

        await writeOrderMovement(
            tx,
            input,
            {
                ...target,
                quantityDelta: -sold,
                note:
                    sold < line.quantity
                        ? `Продано ${line.quantity}, на складе было ${current.stock}`
                        : null,
            },
            StockMovementReason.SALE,
            current.stock,
        );
    }

    await releaseOrderStock(tx, input.orderId);
}

export async function applyStockReturn(
    tx: Tx,
    input: OrderStockInput,
): Promise<void> {
    const sales = await tx
        .select({
            productId: stockMovements.productId,
            variantId: stockMovements.variantId,
            quantityDelta: stockMovements.quantityDelta,
        })
        .from(stockMovements)
        .where(
            and(
                eq(stockMovements.orderId, input.orderId),
                eq(stockMovements.reason, StockMovementReason.SALE),
            ),
        );

    for (const sale of sales) {
        const target = {
            projectId: input.projectId,
            productId: sale.productId,
            variantId: sale.variantId,
        };

        const current = await lockStock(tx, target);

        if (!current) continue;

        await writeOrderMovement(
            tx,
            input,
            { ...target, quantityDelta: -sale.quantityDelta, note: null },
            StockMovementReason.RETURN,
            current.stock,
        );
    }

    await releaseOrderStock(tx, input.orderId);
}

export async function recordManualStockChanges(
    tx: Tx,
    changes: ManualStockChange[],
): Promise<void> {
    const rows = changes.flatMap((change) => {
        const quantityDelta = (change.after ?? 0) - (change.before ?? 0);

        if (quantityDelta === 0) return [];

        return [
            {
                projectId: change.projectId,
                productId: change.productId,
                variantId: change.variantId,
                quantityDelta,
                reason: StockMovementReason.MANUAL,
                note: change.note,
                createdBy: change.createdBy,
            },
        ];
    });

    if (rows.length === 0) return;

    await tx.insert(stockMovements).values(rows);
}

export async function adjustStock(
    tx: Tx,
    change: Omit<ManualStockChange, 'before' | 'after'> & {
        stock: number | null;
    },
): Promise<void> {
    const current = await lockStock(tx, change);

    if (!current) {
        throw new ApplicationError(
            change.variantId ? 'Вариант товара не найден' : 'Товар не найден',
        );
    }
    if (change.stock !== null && current.type === ProductType.SERVICE) {
        throw new ApplicationError('Остаток неприменим к услугам');
    }

    await setStock(tx, change, change.stock);

    await recordManualStockChanges(tx, [
        { ...change, before: current.stock, after: change.stock },
    ]);
}
