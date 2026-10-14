import { type FieldValues, FormProvider, useForm } from 'react-hook-form';
import { Input } from '@/ui/Controlled/Input';
import type { Decorator, Meta, StoryObj } from '@storybook/react';

function withReactHookForm(defaultValues: FieldValues = {}): Decorator {
    return function FormDecorator(Story) {
        const form = useForm({ defaultValues });

        return (
            <FormProvider {...form}>
                <form
                    style={{ minWidth: 320 }}
                    onSubmit={form.handleSubmit(() => undefined)}
                >
                    <Story />
                </form>
            </FormProvider>
        );
    };
}

const meta = {
    title: 'Controlled/Input',
    component: Input,
    decorators: [withReactHookForm({ email: '', amount: undefined })],
    parameters: { layout: 'padded' },
    args: {
        name: 'email',
        label: 'Email',
        placeholder: 'you@example.com',
    },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDescription: Story = {
    args: {
        description: 'Мы не передаём адрес третьим лицам',
    },
};

export const NumberField: Story = {
    args: {
        name: 'amount',
        label: 'Сумма',
        type: 'number',
        placeholder: '0',
    },
};

export const Prefilled: Story = {
    decorators: [withReactHookForm({ email: 'user@dannis.online' })],
};
