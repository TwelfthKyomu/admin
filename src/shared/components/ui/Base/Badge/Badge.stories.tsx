import { Badge } from '@/ui/Base/Badge';
import type { Meta, StoryObj } from '@storybook/react';

const VARIANTS = ['default', 'secondary', 'destructive', 'outline'] as const;

const meta = {
    title: 'Base/Badge',
    component: Badge,
    args: { children: 'Бейдж' },
    argTypes: {
        variant: { control: 'select', options: VARIANTS },
    },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Destructive: Story = { args: { variant: 'destructive' } };
export const Outline: Story = { args: { variant: 'outline' } };

export const AllVariants: Story = {
    render: (args) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {VARIANTS.map((variant) => (
                <Badge
                    key={variant}
                    {...args}
                    variant={variant}
                >
                    {variant}
                </Badge>
            ))}
        </div>
    ),
};
