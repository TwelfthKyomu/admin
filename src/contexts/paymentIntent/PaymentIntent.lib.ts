import 'server-only';

import { db, type Tx } from '@/infrastructure/database/client';
import type {
    CreatePaymentOutput,
    PaymentProviderCredentials,
    PaymentWebhookEvent,
    WebhookOutcome,
} from '@/infrastructure/payments/provider';
import { createStripePayment } from '@/infrastructure/payments/stripe';
import { ApplicationError } from '@/shared/api/errors';
import { insertOne, updateOne } from '@/shared/api/repository';
import { getErrorMessage } from '@/shared/lib/errors';
import { decryptCredentials } from '@/shared/security/encryption';
import { IntegrationType } from '@/contexts/integration/Integration.types';
import { projectIntegrations } from '@/contexts/integration/Integrations.table';
import { findOrderInProject, lockOrder } from '@/contexts/order/Order.lib';
import { isOrderCancelled, orderAmountDue } from '@/contexts/order/Order.types';
import { mailOrderPaid } from '@/contexts/order/OrderMail.lib';
import { applyOrderPayment } from '@/contexts/order/OrderPayment.lib';
import { PaymentMethod } from '@/contexts/payment/Payment.types';
import { and, asc, eq } from 'drizzle-orm';
import { after } from 'next/server';
import { PaymentIntentStatus } from './PaymentIntent.types';
import {
    type PaymentIntentRecord,
    paymentIntents,
} from './PaymentIntents.table';

export async function getProviderCredentials(
    integrationId: string,
    activeInProjectId?: string,
): Promise<PaymentProviderCredentials | null> {
    const [row] = await db
        .select({
            provider: projectIntegrations.provider,
            credentials: projectIntegrations.credentials,
        })
        .from(projectIntegrations)
        .where(
            and(
                eq(projectIntegrations.id, integrationId),
                eq(projectIntegrations.type, IntegrationType.PAYMENT_PROVIDER),
                activeInProjectId
                    ? and(
                          eq(projectIntegrations.projectId, activeInProjectId),
                          eq(projectIntegrations.isActive, true),
                      )
                    : undefined,
            ),
        )
        .limit(1);

    if (!row?.provider || !row.credentials) return null;

    return {
        integrationId,
        provider: row.provider,
        payload: decryptCredentials(row.credentials),
    };
}

export async function findActiveProviderId(projectId: string): Promise<string> {
    const [provider] = await db
        .select({ id: projectIntegrations.id })
        .from(projectIntegrations)
        .where(
            and(
                eq(projectIntegrations.projectId, projectId),
                eq(projectIntegrations.type, IntegrationType.PAYMENT_PROVIDER),
                eq(projectIntegrations.isActive, true),
            ),
        )
        .orderBy(asc(projectIntegrations.createdAt))
        .limit(1);

    if (!provider) {
        throw new ApplicationError(
            'Онлайн-оплата не подключена: добавьте платёжного провайдера в проекте',
        );
    }

    return provider.id;
}

function amountMismatch(
    intent: PaymentIntentRecord,
    event: PaymentWebhookEvent,
): string | null {
    const amountDiffers =
        event.amount !== undefined && event.amount !== intent.amount;

    const currencyDiffers =
        event.currency !== undefined && event.currency !== intent.currency;

    return amountDiffers || currencyDiffers
        ? `Провайдер сообщил ${event.amount} ${event.currency}, ожидалось ${intent.amount} ${intent.currency}`
        : null;
}

async function recordIntentPayment(
    tx: Tx,
    intent: PaymentIntentRecord,
): Promise<string | null> {
    try {
        await tx.transaction(async (savepoint) => {
            const order = await lockOrder(
                savepoint,
                intent.orderId,
                intent.projectId,
            );

            await applyOrderPayment(savepoint, order, {
                amount: intent.amount,
                method: PaymentMethod.ONLINE,
                sourceIntentId: intent.id,
                recordedBy: null,
            });
        });

        return null;
    } catch (error) {
        return getErrorMessage(error);
    }
}

export async function applyPaymentWebhookEvent(
    integrationId: string,
    event: PaymentWebhookEvent,
): Promise<WebhookOutcome> {
    if (!event.providerPaymentId) return 'ignored';

    return db.transaction(async (tx) => {
        const [intent] = await tx
            .select()
            .from(paymentIntents)
            .where(
                and(
                    eq(paymentIntents.integrationId, integrationId),
                    eq(
                        paymentIntents.providerPaymentId,
                        event.providerPaymentId,
                    ),
                ),
            )
            .limit(1)
            .for('update');

        if (!intent) return 'ignored';

        if (intent.status === PaymentIntentStatus.SUCCEEDED) return 'ignored';

        if (event.status === PaymentIntentStatus.CANCELLED) {
            await tx
                .update(paymentIntents)
                .set({ status: PaymentIntentStatus.CANCELLED })
                .where(eq(paymentIntents.id, intent.id));

            return 'cancelled';
        }
        if (event.status !== PaymentIntentStatus.SUCCEEDED) return 'ignored';

        const applyError =
            amountMismatch(intent, event) ??
            (await recordIntentPayment(tx, intent));

        await tx
            .update(paymentIntents)
            .set({
                status: PaymentIntentStatus.SUCCEEDED,
                metadata: applyError
                    ? { ...intent.metadata, applyError }
                    : intent.metadata,
            })
            .where(eq(paymentIntents.id, intent.id));

        if (!applyError) after(() => mailOrderPaid(intent.orderId));

        return 'applied';
    });
}

export async function startOnlinePayment(input: {
    projectId: string;
    integrationId: string;
    orderId: string;
    amount: number;
    currency: string;
    returnUrl: string;
    description?: string;
    expiresAt?: Date;
}): Promise<PaymentIntentRecord> {
    const [credentials, order] = await Promise.all([
        getProviderCredentials(input.integrationId, input.projectId),
        findOrderInProject(input.orderId, input.projectId),
    ]);

    if (!credentials) {
        throw new ApplicationError(
            'Платёжный провайдер не подключён к этому проекту',
        );
    }
    if (isOrderCancelled(order.status)) {
        throw new ApplicationError('Нельзя оплатить отменённый заказ');
    }
    if (input.currency !== order.currency) {
        throw new ApplicationError('Валюта платежа не совпадает с заказом');
    }
    if (input.amount > orderAmountDue(order)) {
        throw new ApplicationError('Сумма платежа превышает остаток по заказу');
    }

    const intent = await insertOne(
        paymentIntents,
        {
            projectId: input.projectId,
            integrationId: input.integrationId,
            orderId: input.orderId,
            amount: input.amount,
            currency: order.currency,
        },
        'Не удалось создать платёж',
    );

    let created: CreatePaymentOutput;

    try {
        created = await createStripePayment(credentials, {
            intent: {
                id: intent.id,
                amount: intent.amount,
                currency: intent.currency,
                idempotenceKey: intent.idempotenceKey,
            },
            returnUrl: input.returnUrl,
            description: input.description,
            expiresAt: input.expiresAt,
        });
    } catch (error) {
        await db
            .update(paymentIntents)
            .set({ status: PaymentIntentStatus.CANCELLED })
            .where(eq(paymentIntents.id, intent.id));

        throw error;
    }

    return updateOne(
        paymentIntents,
        eq(paymentIntents.id, intent.id),
        {
            providerPaymentId: created.providerPaymentId,
            confirmationUrl: created.confirmationUrl,
            metadata: created.metadata ?? {},
        },
        'Не удалось сохранить платёж',
    );
}
