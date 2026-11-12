import { useState } from 'react';
import { ColorPicker } from '@/ui/Base/ColorPicker';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
    title: 'Base/ColorPicker',
    component: ColorPicker,
    args: { value: '#3b82f6', onChange: () => undefined },
} satisfies Meta<typeof ColorPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: (args) => {
        const [value, setValue] = useState(args.value);

        return (
            <div style={{ width: 280 }}>
                <ColorPicker
                    {...args}
                    value={value}
                    onChange={setValue}
                />
            </div>
        );
    },
};
