'use client';

import { useForm } from 'react-hook-form';
import { fmtTime } from '@/shared/format/date';
import { fmtMoney } from '@/shared/format/money';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { fromNone, NONE } from '@/shared/lib/none';
import { OrderType, useCreateOrder } from '@/contexts/order';
import {
    ProductType,
    SELLABLE_PRODUCT_STATUSES,
    useProductsList,
} from '@/contexts/product';
import { zodResolver } from '@hookform/resolvers/zod';
import { parse } from 'date-fns';
import { useClientPicker } from '../../hooks/useClientPicker';
import {
    type BookingPrefill,
    CreateBookingFormSchema,
    type CreateBookingFormValues,
} from '../form/formData';
import { serviceMinutes } from '../lib/bookingTime';

export function useCreateBooking(projectId: string, prefill: BookingPrefill) {
    const close = useModalClose();
    const { mutateAsync, isPending } = useCreateOrder(projectId);
    const productsQuery = useProductsList({ projectId });

    const form = useForm<CreateBookingFormValues>({
        defaultValues: {
            clientId: NONE,
            serviceProductId: NONE,
            customerName: '',
            customerPhone: '',
            assignedEmployeeId: prefill.employeeId,
            scheduledDate: prefill.start,
            startTime: fmtTime(prefill.start),
            durationMinutes: prefill.durationMinutes,
            notes: '',
        },
        resolver: zodResolver(CreateBookingFormSchema),
        mode: 'onChange',
    });

    const { clientOptions, onClientChange } = useClientPicker(
        projectId,
        form.setValue,
    );

    const services = (productsQuery.data ?? []).filter(
        (product) =>
            product.type === ProductType.SERVICE &&
            SELLABLE_PRODUCT_STATUSES.includes(product.status) &&
            product.attributes.bookable !== false,
    );

    const serviceOptions = [
        { value: NONE, label: 'Без услуги (вручную)' },
        ...services.map((service) => ({
            value: service.id,
            label: `${service.name} · ${serviceMinutes(service)} мин · ${fmtMoney(service.price, service.currency)}`,
        })),
    ];

    const onServiceChange = (serviceId: string) => {
        const service = services.find(
            (candidate) => candidate.id === serviceId,
        );

        if (!service) return;

        form.setValue('durationMinutes', serviceMinutes(service), {
            shouldValidate: true,
        });
    };

    const submit = async (values: CreateBookingFormValues) => {
        const service = services.find(
            (candidate) => candidate.id === values.serviceProductId,
        );

        const { success } = await runAction(
            mutateAsync({
                projectId,
                type: OrderType.BOOKING,
                clientId: fromNone(values.clientId) ?? undefined,
                assignedEmployeeId: values.assignedEmployeeId,
                scheduledAt: parse(
                    values.startTime,
                    'HH:mm',
                    values.scheduledDate,
                ),
                durationMinutes: values.durationMinutes,
                customerName: values.customerName.trim(),
                customerPhone: values.customerPhone?.trim() || undefined,
                notes: values.notes?.trim() || undefined,
                items: service && [
                    {
                        productId: service.id,
                        performerEmployeeId: values.assignedEmployeeId,
                        name: service.name,
                        type: ProductType.SERVICE,
                        unitPriceAmount: service.price,
                        quantity: 1,
                        durationMinutes: values.durationMinutes,
                    },
                ],
            }),
            { success: 'Запись создана' },
        );

        if (success) close();
    };

    return {
        form,
        isPending,
        clientOptions,
        serviceOptions,
        onClientChange,
        onServiceChange,
        submit,
    };
}
