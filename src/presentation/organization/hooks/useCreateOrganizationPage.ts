'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { runAction } from '@/shared/lib/action-result';
import {
    CreateOrganizationActionInputSchema,
    useCreateOrganization,
} from '@/contexts/organization';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import type { CreateOrganizationFormValues } from '../form/formData';

export const useCreateOrganizationPage = () => {
    const { push } = useRouter();
    const { mutateAsync, isPending } = useCreateOrganization();

    const form = useForm<CreateOrganizationFormValues>({
        resolver: zodResolver(CreateOrganizationActionInputSchema),
        defaultValues: { name: '' },
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<CreateOrganizationFormValues> = async (
        values,
    ) => {
        const { success } = await runAction(mutateAsync(values), {
            success: 'Организация создана',
        });

        if (!success) return;

        push('/');
    };

    return { isPending, form, onSubmit };
};
