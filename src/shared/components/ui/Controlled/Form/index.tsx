'use client';

import type { FormHTMLAttributes, PropsWithChildren } from 'react';
import {
    type FieldValues,
    FormProvider,
    type SubmitHandler,
    type UseFormReturn,
} from 'react-hook-form';
import { cn } from '@/shared/lib/utils';

interface FormProps<TFieldValues extends FieldValues>
    extends PropsWithChildren,
        Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
    onSubmit: SubmitHandler<TFieldValues>;
    form: UseFormReturn<TFieldValues>;
}

const Form = <T extends FieldValues>({
    form,
    onSubmit,
    children,
    className,
    ...rest
}: FormProps<T>) => {
    return (
        <FormProvider {...form}>
            <form
                className={cn('contents', className)}
                onSubmit={form.handleSubmit(onSubmit)}
                {...rest}
            >
                {children}
            </form>
        </FormProvider>
    );
};

export { Form };
