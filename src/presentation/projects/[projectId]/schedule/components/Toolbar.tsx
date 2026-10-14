'use client';

import { Button, Select, TimePicker } from '@/ui/Base';
import { useScheduleContext } from './ScheduleProvider';

export const Toolbar = () => {
    const { employeeOptions, builder } = useScheduleContext();

    return (
        <>
            <Select
                size="sm"
                value={builder.employeeId}
                onValueChange={builder.setEmployeeId}
                placeholder="Сотрудник"
                options={employeeOptions}
            />
            <TimePicker
                size="sm"
                className="w-fit"
                value={builder.start}
                onValueChange={builder.setStart}
            />
            <span className="text-muted-foreground">–</span>
            <TimePicker
                size="sm"
                className="w-fit"
                value={builder.end}
                onValueChange={builder.setEnd}
            />
            <div className="ml-auto flex items-center gap-2">
                <Button
                    type="button"
                    size="sm"
                    disabled={
                        builder.isPending || builder.selectedCount === 0 || !builder.employeeId
                    }
                    onClick={builder.submit}
                >
                    {`Создать смены (${builder.selectedCount})`}
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={builder.isPending || builder.selectedCount === 0}
                    onClick={builder.clear}
                >
                    Очистить
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={builder.isPending}
                    onClick={builder.close}
                >
                    Готово
                </Button>
            </div>
        </>
    );
};
