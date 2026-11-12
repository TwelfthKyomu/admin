'use client';

import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { ROUTES } from '@/shared/constants';
import { fmtMoney } from '@/shared/format/money';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { fromNone, NONE } from '@/shared/lib/none';
import { useCreateOrder } from '@/contexts/order';
import {
    ProductType,
    SELLABLE_PRODUCT_STATUSES,
    useProductsList,
} from '@/contexts/product';
import { useWarehousesList } from '@/contexts/warehouse';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useClientPicker } from '../../hooks/useClientPicker';
import {
    CreateSaleFormSchema,
    type CreateSaleFormValues,
} from '../form/formData';
import { READY_TIME_DEFAULT, readyByOf } from '../lib/readyBy';
import { stockLabel } from '../lib/saleStock';
import { sellablesOf } from '../lib/sellables';

export const useCreateSale = (projectId: string) => {
    const close = useModalClose();
    const router = useRouter();
    const { mutateAsync, isPending } = useCreateOrder();
    const productsQuery = useProductsList({ projectId });
    const warehousesQuery = useWarehousesList(projectId);

    const form = useForm<CreateSaleFormValues>({
        defaultValues: {
            clientId: NONE,
            customerName: '',
            customerPhone: '',
            items: [{ itemKey: '', quantity: 1, unitPriceAmount: 0 }],
            notes: '',
            readyDate: undefined,
            readyTime: READY_TIME_DEFAULT,
            warehouseId: '',
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
        .filter((product) => SELLABLE_PRODUCT_STATUSES.includes(product.status))
        .flatMap(sellablesOf);

    const sellableByKey = new Map(sellables.map((item) => [item.key, item]));

    const productOptions = sellables.map((item) => ({
        value: item.key,
        label: [
            item.name,
            fmtMoney(item.price, item.currency),
            stockLabel(item.stock),
        ]
            .filter(Boolean)
            .join(' · '),
        keywords: [item.sku, item.barcode].filter((code) => code !== undefined),
    }));

    const warehouseOptions = (warehousesQuery.data ?? []).map((warehouse) => ({
        value: warehouse.id,
        label: warehouse.name,
    }));

    const hasService = items.some(
        (line) =>
            sellableByKey.get(line.itemKey ?? '')?.type === ProductType.SERVICE,
    );

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
                clientId: fromNone(values.clientId) ?? undefined,
                customerName: values.customerName?.trim() || undefined,
                customerPhone: values.customerPhone?.trim() || undefined,
                notes: values.notes?.trim() || undefined,
                warehouseId: values.warehouseId || undefined,
                readyBy: hasService
                    ? readyByOf(values.readyDate, values.readyTime)
                    : undefined,
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
        warehouseOptions,
        itemFields: itemsArray.fields,
        removeItem: itemsArray.remove,
        addItem,
        totalAmount,
        hasService,
        onClientChange,
        onItemChange,
        submit,
    };
};
