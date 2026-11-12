'use client';

import { useState } from 'react';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import {
    ShiftAction,
    ShiftCancelReason,
    useChangeShiftStatus,
} from '@/contexts/employeeShift';

export const useShiftCancelModal = (projectId: string, shiftId: string) => {
    const close = useModalClose();

    const [reason, setReason] = useState<ShiftCancelReason>(
        ShiftCancelReason.SICK,
    );

    const { mutateAsync, isPending } = useChangeShiftStatus();

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

    return { close, reason, setReason, isPending, onConfirm };
};
