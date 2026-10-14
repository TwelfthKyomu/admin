import type { ComponentProps } from 'react';
import { OwnShiftList } from './OwnShiftList';

interface OwnShiftsProps extends ComponentProps<typeof OwnShiftList> {
    title: string;
}

export const OwnShifts = ({ title, ...listProps }: OwnShiftsProps) => (
    <aside className="flex max-h-[calc(100svh-11rem)] flex-col gap-3 rounded-xl border border-border p-4 lg:sticky lg:top-0">
        <div className="grid gap-0.5">
            <span className="text-[13px] font-semibold">{title}</span>
            <span className="text-[12px] text-muted-foreground">
                Не можете выйти — отметьте, и смену увидят коллеги.
            </span>
        </div>
        <OwnShiftList {...listProps} />
    </aside>
);
