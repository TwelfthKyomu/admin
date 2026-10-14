'use client';

import { useState } from 'react';
import { SHIFT_CANCEL_REASON_OPTIONS } from '@/shared/labels/team';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { ShiftAction, ShiftCancelReason, useChangeShiftStatus } from '@/contexts/employeeShift';
import { Button, Field, FieldLabel, Modal, Select } from '@/ui/Base';

interface ShiftCancelModalProps {
    projectId: string;
    shiftId: string;
    employeeName: string;
}

export const ShiftCancelModal = ({ projectId, shiftId, employeeName }: ShiftCancelModalProps) => {
    const close = useModalClose();
    const [reason, setReason] = useState<ShiftCancelReason>(ShiftCancelReason.SICK);
    const { mutateAsync, isPending } = useChangeShiftStatus(projectId);

    const onConfirm = async () => {
        const { success } = await runAction(
            mutateAsync({
                id: shiftId,
                projectId,
                action: ShiftAction.CANCEL,
                cancelReason: reason,
            }),
            { success: 'Смена отменена' },
        );

        if (success) close();
    };

    return (
        <Modal
            onClose={close}
            busy={isPending}
            title="Отменить смену"
            description={
                <>
                    Смена <strong>{employeeName}</strong> будет отменена. Записанных клиентов в этом
                    окне лучше перенести или заменить сотрудника.
                </>
            }
        >
            <Field>
                <FieldLabel>Причина</FieldLabel>
                <Select
                    options={SHIFT_CANCEL_REASON_OPTIONS}
                    value={reason}
                    onValueChange={setReason}
                />
            </Field>
            <Modal.Footer className="px-0">
                <Button
                    variant="destructive"
                    disabled={isPending}
                    onClick={onConfirm}
                >
                    Отменить смену
                </Button>
                <Button
                    variant="outline"
                    disabled={isPending}
                    onClick={close}
                >
                    Закрыть
                </Button>
            </Modal.Footer>
        </Modal>
    );
};
