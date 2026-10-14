'use client';

import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { ROUTES } from '@/shared/constants';
import { fmtMoney } from '@/shared/format/money';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { fromNone, NONE } from '@/shared/lib/none';
import { OrderType, useCreateOrder } from '@/contexts/order';
import {
    ProductType,
    type ProductView,
    SELLABLE_PRODUCT_STATUSES,
    useProductsList,
    variantComboLabel,
} from '@/contexts/product';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useClientPicker } from '../../hooks/useClientPicker';
import {
    CreateSaleFormSchema,
    type CreateSaleFormValues,
} from '../form/formData';

interface Sellable {
    key: string;
    productId: string;
    variantId?: string;
    name: string;
    type: ProductType;
    price: number;
    currency: ProductView['currency'];
    sku?: string;
}

function sellablesOf(product: ProductView): Sellable[] {
    const variants = product.variants.filter((variant) => variant.isActive);

    if (variants.length === 0) {
        return [
            {
                key: product.id,
                productId: product.id,
                name: product.name,
                type: product.type,
                price: product.price,
                currency: product.currency,
                sku: product.sku,
            },
        ];
    }

    return variants.map((variant) => ({
        key: `${product.id}:${variant.id}`,
        productId: product.id,
        variantId: variant.id,
        name: `${product.name} (${variantComboLabel(variant.optionValues)})`,
        type: product.type,
        price: variant.price ?? product.price,
        currency: product.currency,
        sku: variant.sku ?? product.sku,
    }));
}

export function useCreateSale(projectId: string) {
    const close = useModalClose();
    const router = useRouter();
    const { mutateAsync, isPending } = useCreateOrder(projectId);
    const productsQuery = useProductsList({ projectId });

    const form = useForm<CreateSaleFormValues>({
        defaultValues: {
            clientId: NONE,
            customerName: '',
            customerPhone: '',
            items: [{ itemKey: '', quantity: 1, unitPriceAmount: 0 }],
            notes: '',
        },
        resolver: zodResolver(CreateSaleFormSchema),
        mode: 'onChange',
    });

    const { clientOptions, onClientChange } = useClientPicker(
        projectId,
        form.setValue,
    );

    const itemsArray = useFieldArray({ control: form.control, name: 'items' });
    const items = useWatch({ control: form.control, name: 'items' }) ?? [];

    const sellables = (productsQuery.data ?? [])
        .filter(
            (product) =>
                product.type !== ProductType.SERVICE &&
                SELLABLE_PRODUCT_STATUSES.includes(product.status),
        )
        .flatMap(sellablesOf);

    const sellableByKey = new Map(sellables.map((item) => [item.key, item]));

    const productOptions = sellables.map((item) => ({
        value: item.key,
        label: `${item.name} · ${fmtMoney(item.price, item.currency)}`,
        keywords: item.sku ? [item.sku] : undefined,
    }));

    const totalAmount = items.reduce(
        (sum, item) => sum + (item.unitPriceAmount ?? 0) * (item.quantity ?? 0),
        0,
    );

    const onItemChange = (index: number, itemKey: string) => {
        const item = sellableByKey.get(itemKey);

        if (!item) return;

        form.setValue(`items.${index}.unitPriceAmount`, item.price, {
            shouldValidate: true,
        });
    };

    const addItem = () =>
        itemsArray.append({ itemKey: '', quantity: 1, unitPriceAmount: 0 });

    const submit = async (values: CreateSaleFormValues) => {
        const { success, response } = await runAction(
            mutateAsync({
                projectId,
                type: OrderType.SALE,
                clientId: fromNone(values.clientId) ?? undefined,
                customerName: values.customerName?.trim() || undefined,
                customerPhone: values.customerPhone?.trim() || undefined,
                notes: values.notes?.trim() || undefined,
                items: values.items.flatMap((line) => {
                    const item = sellableByKey.get(line.itemKey);

                    if (!item) return [];

                    return {
                        productId: item.productId,
                        variantId: item.variantId,
                        name: item.name,
                        type: item.type,
                        unitPriceAmount: line.unitPriceAmount,
                        quantity: line.quantity,
                    };
                }),
            }),
            { success: 'Продажа создана' },
        );

        if (!success) return;

        close();
        const orderId = response?.data?.id;

        if (orderId) router.push(ROUTES.project(projectId, 'orders', orderId));
    };

    return {
        form,
        isPending,
        clientOptions,
        productOptions,
        itemFields: itemsArray.fields,
        removeItem: itemsArray.remove,
        addItem,
        totalAmount,
        onClientChange,
        onItemChange,
        submit,
    };
}
