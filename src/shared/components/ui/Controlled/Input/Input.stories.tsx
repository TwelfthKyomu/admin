import { type FieldValues, FormProvider, useForm } from 'react-hook-form';
import { Input } from '@/ui/Controlled/Input';
import type { Decorator, Meta, StoryObj } from '@storybook/react';

const FormDecorator: Decorator = (Story, { parameters }) => {
    const form = useForm<FieldValues>({ defaultValues: parameters.formDefaults });

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

const meta = {
    title: 'Controlled/Input',
    component: Input,
    decorators: [FormDecorator],
    parameters: { layout: 'padded', formDefaults: { email: '', amount: undefined } },
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
    parameters: { formDefaults: { email: 'user@dannis.online' } },
};
