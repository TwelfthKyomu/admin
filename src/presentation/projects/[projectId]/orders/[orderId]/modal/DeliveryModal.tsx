'use client';

import { FormDialog } from '@/shared/components/common';
import { fmtMoney } from '@/shared/format/money';
import { DELIVERY_CARRIER_OPTIONS, DELIVERY_KIND_OPTIONS } from '@/shared/labels/delivery';
import type { Option } from '@/shared/types';
import { type DeliveryCarrier, DeliveryKind, type DeliveryView } from '@/contexts/delivery';
import type { OrderView } from '@/contexts/order';
import { DatePicker, Input, Money, Select, TimePicker } from '@/ui/Controlled';
import { type DeliveryFormValues, TO_QUEUE } from '../form/formData';
import { useDeliveryModal } from '../hooks/useDeliveryModal';

interface DeliveryModalProps {
    projectId: string;
    order: OrderView;
    initial?: DeliveryView;
    couriers: Option[];
}

export const DeliveryModal = ({ projectId, order, initial, couriers }: DeliveryModalProps) => {
    const { form, kind, amountDue, isPending, submit } = useDeliveryModal({
        projectId,
        order,
        initial,
    });

    return (
        <FormDialog
            title={initial ? 'Изменить доставку' : 'Доставка заказа'}
            description={
                kind === DeliveryKind.COURIER
                    ? 'Курьер увидит адрес, окно и сумму, которую нужно взять у двери.'
                    : 'Трек-номер откроет статус на сайте службы.'
            }
            className="max-w-md"
            bodyClassName="grid gap-3"
            form={form}
            onSubmit={submit}
            submitLabel="Сохранить"
            requireValid={false}
            requireDirty={false}
            busy={isPending}
        >
            {!initial && (
                <Select<DeliveryFormValues, 'kind', DeliveryKind>
                    name="kind"
                    label="Как доставляем"
                    options={DELIVERY_KIND_OPTIONS}
                />
            )}

            {kind === DeliveryKind.COURIER ? (
                <>
                    <Input<DeliveryFormValues>
                        name="address"
                        label="Адрес"
                        placeholder="ул. Ленина, 54, кв. 7, подъезд 2"
                        autoFocus
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Input<DeliveryFormValues>
                            name="recipientName"
                            label="Получатель"
                        />
                        <Input<DeliveryFormValues>
                            name="recipientPhone"
                            label="Телефон"
                            type="tel"
                        />
                    </div>
                    <div className="grid grid-cols-[minmax(0,1fr)_7rem_7rem] gap-3">
                        <DatePicker<DeliveryFormValues>
                            name="windowDate"
                            label="Дата доставки"
                        />
                        <TimePicker<DeliveryFormValues>
                            name="windowFrom"
                            label="С"
                        />
                        <TimePicker<DeliveryFormValues>
                            name="windowTo"
                            label="До"
                        />
                    </div>
                    <Money<DeliveryFormValues>
                        name="cashDue"
                        label={`Взять у двери (остаток ${fmtMoney(amountDue, order.currency)})`}
                    />
                    {!initial && (
                        <Select<DeliveryFormValues, 'courierId', string>
                            name="courierId"
                            label="Курьер"
                            options={[
                                { value: TO_QUEUE, label: 'В очередь — курьер возьмёт сам' },
                                ...couriers,
                            ]}
                        />
                    )}
                </>
            ) : (
                <>
                    <Select<DeliveryFormValues, 'carrier', DeliveryCarrier>
                        name="carrier"
                        label="Служба"
                        options={DELIVERY_CARRIER_OPTIONS}
                    />
                    <Input<DeliveryFormValues>
                        name="trackingNumber"
                        label="Трек-номер"
                        placeholder="1010101010101"
                    />
                    <Input<DeliveryFormValues>
                        name="address"
                        label="Адрес (необязательно)"
                    />
                </>
            )}
        </FormDialog>
    );
};
