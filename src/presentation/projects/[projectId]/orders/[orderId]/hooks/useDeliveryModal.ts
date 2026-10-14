'use client';

import { useForm, useWatch } from 'react-hook-form';
import { fmtMoney } from '@/shared/format/money';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import {
    DeliveryCarrier,
    DeliveryKind,
    type DeliveryView,
    useCreateDelivery,
    useUpdateDelivery,
} from '@/contexts/delivery';
import { type OrderView, orderAmountDue } from '@/contexts/order';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parse } from 'date-fns';
import {
    DeliveryFormSchema,
    type DeliveryFormValues,
    TO_QUEUE,
} from '../form/formData';
import { defaultDeliveryWindow } from '../lib/delivery';

const TIME = 'HH:mm';

interface UseDeliveryModalOptions {
    projectId: string;
    order: OrderView;
    initial?: DeliveryView;
}

export function useDeliveryModal({
    projectId,
    order,
    initial,
}: UseDeliveryModalOptions) {
    const close = useModalClose();
    const create = useCreateDelivery(projectId);
    const update = useUpdateDelivery(projectId);
    const isPending = create.isPending || update.isPending;
    const amountDue = orderAmountDue(order);
    const currency = order.currency;

    const suggested = defaultDeliveryWindow();

    const form = useForm<DeliveryFormValues>({
        resolver: zodResolver(DeliveryFormSchema),
        defaultValues: {
            kind: initial?.kind ?? DeliveryKind.COURIER,
            address: initial?.address ?? '',
            recipientName: initial?.recipientName ?? order.customerName ?? '',
            recipientPhone:
                initial?.recipientPhone ?? order.customerPhone ?? '',
            windowDate: initial?.windowStart ?? suggested.start,
            windowFrom: format(initial?.windowStart ?? suggested.start, TIME),
            windowTo: format(initial?.windowEnd ?? suggested.end, TIME),
            cashDue: initial?.cashDue ?? amountDue,
            courierId: TO_QUEUE,
            carrier: initial?.carrier ?? DeliveryCarrier.CDEK,
            trackingNumber: initial?.trackingNumber ?? '',
        },
    });

    const kind = useWatch({ control: form.control, name: 'kind' });

    const saveCarrier = (values: DeliveryFormValues) => {
        const trackingNumber = values.trackingNumber.trim();

        if (!trackingNumber) {
            form.setError('trackingNumber', { message: 'Укажите трек-номер' });

            return undefined;
        }

        const carrier = { carrier: values.carrier, trackingNumber };
        const address = values.address.trim();

        if (initial)
            return update.mutateAsync({
                projectId,
                id: initial.id,
                ...carrier,
                address,
            });

        return create.mutateAsync({
            projectId,
            orderId: order.id,
            kind: DeliveryKind.CARRIER,
            ...carrier,
            address: address || null,
        });
    };

    const saveCourier = (values: DeliveryFormValues) => {
        const address = values.address.trim();

        const windowStart =
            values.windowDate &&
            parse(values.windowFrom, TIME, values.windowDate);

        const windowEnd =
            values.windowDate &&
            parse(values.windowTo, TIME, values.windowDate);

        const cashDue = values.cashDue ?? 0;

        if (!address) form.setError('address', { message: 'Куда везти?' });
        if (!windowStart)
            form.setError('windowDate', { message: 'Укажите дату доставки' });
        if (!windowEnd || (windowStart && windowEnd <= windowStart)) {
            form.setError('windowTo', {
                message: 'Конец окна — позже начала',
            });
        }

        if (cashDue > amountDue) {
            form.setError('cashDue', {
                message: `Не больше остатка: ${fmtMoney(amountDue, currency)}`,
            });
        }

        if (
            !address ||
            !windowStart ||
            !windowEnd ||
            windowEnd <= windowStart ||
            cashDue > amountDue
        ) {
            return undefined;
        }

        const courier = {
            address,
            recipientName: values.recipientName.trim() || null,
            recipientPhone: values.recipientPhone.trim() || null,
            windowStart,
            windowEnd,
            cashDue,
        };

        if (initial)
            return update.mutateAsync({
                projectId,
                id: initial.id,
                ...courier,
            });

        return create.mutateAsync({
            projectId,
            orderId: order.id,
            kind: DeliveryKind.COURIER,
            ...courier,
            courierId:
                values.courierId === TO_QUEUE ? undefined : values.courierId,
        });
    };

    const submit = async (values: DeliveryFormValues) => {
        const request =
            values.kind === DeliveryKind.CARRIER
                ? saveCarrier(values)
                : saveCourier(values);

        if (!request) return;

        const { success } = await runAction(request, {
            success: 'Доставка сохранена',
        });

        if (success) close();
    };

    return { form, kind, amountDue, isPending, submit };
}
