'use client';

import { FormDialog } from '@/shared/components/common';
import { Money } from '@/ui/Controlled';
import { useCashShiftOpenSheet } from '../hooks/useCashShiftOpenSheet';

export const CashShiftOpenSheet = ({ projectId }: { projectId: string }) => {
    const { isPending, form, onSubmit } = useCashShiftOpenSheet(projectId);

    return (
        <FormDialog
            surface="sheet"
            title="Открыть кассовую смену"
            description="Укажите начальный остаток наличных в кассе."
            form={form}
            onSubmit={onSubmit}
            submitLabel="Открыть"
            requireValid={false}
            requireDirty={false}
            busy={isPending}
        >
            <Money
                name="openingAmount"
                label="Начальный остаток"
                placeholder="0,00"
            />
        </FormDialog>
    );
};
