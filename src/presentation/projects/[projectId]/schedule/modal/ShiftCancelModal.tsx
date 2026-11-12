'use client';

import { SHIFT_CANCEL_REASON_OPTIONS } from '@/shared/labels/team';
import { Button, Field, FieldLabel, Modal, Select } from '@/ui/Base';
import { useShiftCancelModal } from '../hooks/useShiftCancelModal';

interface ShiftCancelModalProps {
    projectId: string;
    shiftId: string;
    employeeName: string;
}

export const ShiftCancelModal = ({ projectId, shiftId, employeeName }: ShiftCancelModalProps) => {
    const { close, reason, setReason, isPending, onConfirm } = useShiftCancelModal(
        projectId,
        shiftId,
    );

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
