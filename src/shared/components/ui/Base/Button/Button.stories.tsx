import { Button } from '@/ui/Base/Button';
import type { Meta, StoryObj } from '@storybook/react';

const VARIANTS = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const;

const SIZES = ['default', 'xs', 'sm', 'lg'] as const;

const meta = {
    title: 'Base/Button',
    component: Button,
    args: { children: 'Кнопка' },
    argTypes: {
        variant: { control: 'select', options: VARIANTS },
        size: { control: 'select', options: [...SIZES, 'icon'] },
        disabled: { control: 'boolean' },
    },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Outline: Story = { args: { variant: 'outline' } };
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Destructive: Story = { args: { variant: 'destructive' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Link: Story = { args: { variant: 'link' } };
export const Disabled: Story = { args: { disabled: true } };

export const AllVariants: Story = {
    render: (args) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {VARIANTS.map((variant) => (
                <Button
                    key={variant}
                    {...args}
                    variant={variant}
                >
                    {variant}
                </Button>
            ))}
        </div>
    ),
};

export const AllSizes: Story = {
    render: (args) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {SIZES.map((size) => (
                <Button
                    key={size}
                    {...args}
                    size={size}
                >
                    {size}
                </Button>
            ))}
        </div>
    ),
};
