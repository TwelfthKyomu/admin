'use client';

import type { ComponentProps, ReactNode } from 'react';
import type { FieldValues, SubmitHandler, UseFormReturn } from 'react-hook-form';
import { cn } from '@/shared/lib/utils';
import { Button, Modal, Sheet } from '@/ui/Base';
import { Form } from '@/ui/Controlled';
import { useDiscardGuard } from './hooks/useDiscardGuard';

interface FormDialogProps<T extends FieldValues> {
    surface?: 'modal' | 'sheet';
    title: ReactNode;
    description?: ReactNode;
    className?: string;
    footerClassName?: string;
    bodyClassName?: string;
    form: UseFormReturn<T>;
    onSubmit: SubmitHandler<T>;
    submitLabel: ReactNode;
    submitVariant?: ComponentProps<typeof Button>['variant'];
    requireValid?: boolean;
    requireDirty?: boolean;
    busy: boolean;
    children: ReactNode;
}

export const FormDialog = <T extends FieldValues>({
    surface = 'modal',
    title,
    description,
    className,
    footerClassName,
    bodyClassName,
    form,
    onSubmit,
    submitLabel,
    submitVariant,
    requireValid = true,
    requireDirty = true,
    busy,
    children,
}: FormDialogProps<T>) => {
    const { close, isValid, isDirty, canClose, cancel } = useDiscardGuard(form.control);

    const footer = (
        <>
            <Button
                type="submit"
                variant={submitVariant}
                disabled={busy || (requireValid && !isValid) || (requireDirty && !isDirty)}
            >
                {submitLabel}
            </Button>
            <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={cancel}
            >
                Отмена
            </Button>
        </>
    );

    const Surface = surface === 'sheet' ? Sheet : Modal;
    const Footer = surface === 'sheet' ? Sheet.Footer : Modal.Footer;
    const surfaceClassName = surface === 'sheet' ? className : cn('flex flex-col', className);

    const bodyBaseClassName =
        surface === 'sheet' ? 'contents' : '-mx-6 -my-1 min-h-0 overflow-y-auto px-6 py-1';

    return (
        <Surface
            onClose={close}
            canClose={canClose}
            title={title}
            description={description}
            className={surfaceClassName}
            busy={busy}
        >
            <Form
                form={form}
                onSubmit={onSubmit}
            >
                <div className={cn(bodyBaseClassName, bodyClassName)}>{children}</div>
                <Footer className={footerClassName}>{footer}</Footer>
            </Form>
        </Surface>
    );
};
