'use client';

import { Button } from '@/ui/Base';
import { CalendarPlus } from 'lucide-react';
import { useScheduleButtons } from '../hooks/useScheduleButtons';

export const Buttons = () => {
    const { tab, builder, canManage, hasEmployees, openGenerateShifts } = useScheduleButtons();

    if (!canManage) return null;

    return tab === 'calendar' ? (
        <Button
            type="button"
            size="sm"
            variant="outline"
            className="ml-auto"
            disabled={builder.active || !hasEmployees}
            onClick={() => builder.setActive(true)}
        >
            <CalendarPlus />
            Конструктор графика
        </Button>
    ) : (
        <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!hasEmployees}
            onClick={openGenerateShifts}
        >
            Сгенерировать смены
        </Button>
    );
};
