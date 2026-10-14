import { useState } from 'react';
import {
    type ItemRenderContext,
    type ScheduleColumn,
    type ScheduleItem,
    Scheduler,
    type SchedulerMode,
} from '@/ui/Base/Scheduler';
import type { Meta, StoryObj } from '@storybook/react';

interface Appt extends ScheduleItem {
    title: string;
    employeeId: string;
    color: string;
}

const midnight = new Date();

midnight.setHours(0, 0, 0, 0);

function at(hour: number, minute = 0): Date {
    const d = new Date(midnight);

    d.setHours(hour, minute, 0, 0);

    return d;
}

const INITIAL: Appt[] = [
    { id: 'a1', title: 'Стрижка', employeeId: 'm1', start: at(10), end: at(11), color: '#3b82f6' },
    {
        id: 'a2',
        title: 'Окрашивание',
        employeeId: 'm1',
        start: at(12, 30),
        end: at(14),
        color: '#10b981',
    },
    { id: 'a3', title: 'Маникюр', employeeId: 'm2', start: at(11), end: at(12), color: '#f59e0b' },
    {
        id: 'a4',
        title: 'Педикюр',
        employeeId: 'm2',
        start: at(13),
        end: at(14, 30),
        color: '#ec4899',
    },
    {
        id: 'a5',
        title: 'Массаж',
        employeeId: 'm3',
        start: at(15),
        end: at(16, 30),
        color: '#8b5cf6',
    },
];

const columns: ScheduleColumn<Appt>[] = [
    {
        id: 'm1',
        header: 'Анна',
        match: (i) => i.employeeId === 'm1',
        workingHours: [9 * 60, 19 * 60],
        showNow: true,
    },
    {
        id: 'm2',
        header: 'Борис',
        match: (i) => i.employeeId === 'm2',
        workingHours: [10 * 60, 20 * 60],
        showNow: true,
    },
    {
        id: 'm3',
        header: 'Вера',
        match: (i) => i.employeeId === 'm3',
        workingHours: [9 * 60, 18 * 60],
        showNow: true,
    },
];

function renderItem(ctx: ItemRenderContext<Appt>) {
    const { item, selected, dragging, conflict, override, lane, lanes, pxPerMin } = ctx;
    const startMin = override?.startMin ?? item.start.getHours() * 60 + item.start.getMinutes();
    const durationMin = override?.dur ?? (item.end.getTime() - item.start.getTime()) / 60_000;

    return (
        <div
            role="button"
            tabIndex={0}
            onMouseDown={ctx.onMouseDown}
            onClick={ctx.onClick}
            className="absolute z-10 flex flex-col overflow-hidden rounded-md border border-border border-l-2 bg-muted/60 px-1.5 py-1 text-left text-[11px] leading-tight cursor-grab select-none data-[selected=true]:ring-2 data-[selected=true]:ring-primary data-[dragging=true]:opacity-80 data-[dragging=true]:shadow-lg data-[conflict=true]:ring-2 data-[conflict=true]:ring-destructive"
            data-selected={selected}
            data-dragging={dragging}
            data-conflict={conflict}
            style={{
                top: startMin * pxPerMin,
                height: Math.max(durationMin * pxPerMin, 18),
                left: `calc(${(lane / lanes) * 100}% + 2px)`,
                width: `calc(${100 / lanes}% - 4px)`,
                borderLeftColor: item.color,
            }}
        >
            <span className="truncate font-medium">{item.title}</span>
            <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize"
                onMouseDown={ctx.onResizeMouseDown}
            />
        </div>
    );
}

const ApptScheduler = Scheduler<Appt>;

const SchedulerDemo = () => {
    const [items, setItems] = useState<Appt[]>(INITIAL);
    const [date, setDate] = useState<Date>(new Date());
    const [mode, setMode] = useState<SchedulerMode>('day');

    return (
        <div style={{ height: 640 }}>
            <ApptScheduler
                items={items}
                columns={columns}
                renderItem={renderItem}
                date={date}
                onDateChange={setDate}
                mode={mode}
                onModeChange={setMode}
                onMove={(item, patch) =>
                    setItems((prev) =>
                        prev.map((i) =>
                            i.id === item.id
                                ? {
                                      ...i,
                                      start: patch.start,
                                      end: patch.end,
                                      employeeId: patch.columnId,
                                  }
                                : i,
                        ),
                    )
                }
                onResize={(item, patch) =>
                    setItems((prev) =>
                        prev.map((i) => (i.id === item.id ? { ...i, end: patch.end } : i)),
                    )
                }
                onCreate={(patch) =>
                    setItems((prev) => [
                        ...prev,
                        {
                            id: `new-${Date.now()}`,
                            title: 'Новая запись',
                            employeeId: patch.columnId,
                            start: patch.start,
                            end: patch.end,
                            color: '#0ea5e9',
                        },
                    ])
                }
            />
        </div>
    );
};

const meta = {
    title: 'Base/Scheduler',
    component: ApptScheduler,
    parameters: { layout: 'fullscreen' },
    decorators: [
        (Story) => (
            <div style={{ height: 640 }}>
                <Story />
            </div>
        ),
    ],
    args: {
        items: INITIAL,
        columns,
        renderItem,
        date: new Date(),
        onDateChange: () => undefined,
        mode: 'day',
        onModeChange: () => undefined,
    },
} satisfies Meta<typeof ApptScheduler>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Static: Story = {};

export const Interactive: Story = {
    render: () => <SchedulerDemo />,
};
