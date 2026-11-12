import { Calendar } from '@/ui/Base/Calendar';
import type { Meta, StoryObj } from '@storybook/react';
import { ru } from 'react-day-picker/locale';

const meta = {
    title: 'Base/Calendar',
    component: Calendar,
    args: { locale: ru, defaultMonth: new Date(2026, 10, 1) },
} satisfies Meta<typeof Calendar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Single: Story = {
    args: { mode: 'single', selected: new Date(2026, 10, 12) },
};

export const Range: Story = {
    args: {
        mode: 'range',
        selected: { from: new Date(2026, 10, 9), to: new Date(2026, 10, 14) },
        showWeekNumber: true,
    },
};

export const Dropdowns: Story = {
    args: { mode: 'single', captionLayout: 'dropdown' },
};
