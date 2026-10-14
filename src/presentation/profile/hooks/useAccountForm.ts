'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { useStaticData } from '@/app/providers';
import { authClient } from '@/shared/lib/auth-client';
import { toast } from '@/shared/lib/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { AccountFormSchema, type AccountFormValues } from '../form/formData';

export function useAccountForm() {
    const { user } = useStaticData();
    const router = useRouter();

    const form = useForm<AccountFormValues>({
        resolver: zodResolver(AccountFormSchema),
        values: { name: user.name },
    });

    const onSubmit: SubmitHandler<AccountFormValues> = async (values) => {
        const { error } = await authClient.updateUser({ name: values.name });

        if (error) {
            toast.error(error.message ?? 'Не удалось сохранить имя');

            return;
        }

        toast.success('Имя сохранено');
        router.refresh();
    };

    return { form, onSubmit };
}
