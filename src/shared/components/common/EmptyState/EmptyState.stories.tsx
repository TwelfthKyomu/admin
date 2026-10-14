import { EmptyState } from '@/shared/components/common/EmptyState';
import { Button } from '@/ui/Base/Button';
import type { Meta, StoryObj } from '@storybook/react';
import { PackageOpen } from 'lucide-react';

const meta = {
    title: 'Common/EmptyState',
    component: EmptyState,
    args: { title: 'Пока пусто' },
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { description: 'Здесь появятся ваши записи.' },
};

export const WithAction: Story = {
    args: {
        title: 'Нет товаров',
        description: 'Добавьте первый товар в каталог проекта.',
        icon: PackageOpen,
        action: <Button size="sm">Добавить товар</Button>,
    },
};
