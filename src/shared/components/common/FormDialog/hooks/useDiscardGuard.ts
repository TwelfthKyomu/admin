'use client';

import { useRef } from 'react';
import { type Control, type FieldValues, useFormState } from 'react-hook-form';
import { modal, useModalClose } from '@/shared/lib/modal';

export const useDiscardGuard = <T extends FieldValues>(control: Control<T>) => {
    const close = useModalClose();
    const { isValid, isDirty } = useFormState({ control });
    const discardPrompt = useRef<Promise<boolean> | null>(null);

    const canClose = (): Promise<boolean> => {
        if (!isDirty) return Promise.resolve(true);

        discardPrompt.current ??= modal
            .confirm({
                title: 'Закрыть без сохранения?',
                description: 'Введённые изменения пропадут.',
                confirmLabel: 'Закрыть',
                cancelLabel: 'Вернуться к форме',
                tone: 'destructive',
            })
            .finally(() => {
                discardPrompt.current = null;
            });

        return discardPrompt.current;
    };

    const cancel = async () => {
        if (await canClose()) close();
    };

    return { close, isValid, isDirty, canClose, cancel };
};
