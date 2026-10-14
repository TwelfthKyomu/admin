import { ErrorState } from '@/shared/components/common/ErrorState';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
    title: 'Common/ErrorState',
    component: ErrorState,
} satisfies Meta<typeof ErrorState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithRetry: Story = {
    args: { onRetry: () => undefined },
};

export const CustomMessage: Story = {
    args: {
        title: 'Проект недоступен',
        description: 'Возможно, у вас нет прав или он был удалён.',
        onRetry: () => undefined,
    },
};
