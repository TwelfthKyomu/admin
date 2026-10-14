'use client';

import { useForm } from 'react-hook-form';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { ConnectStorageActionInputSchema, useConnectStorage } from '@/contexts/integration';
import { Button, Modal } from '@/ui/Base';
import { Form, Input } from '@/ui/Controlled';
import { zodResolver } from '@hookform/resolvers/zod';
import type * as z from 'zod/mini';

type StorageFormValues = z.infer<typeof ConnectStorageActionInputSchema>;

export const StorageConnectModal = ({ projectId }: { projectId: string }) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useConnectStorage(projectId);

    const form = useForm<StorageFormValues>({
        resolver: zodResolver(ConnectStorageActionInputSchema),
        defaultValues: {
            projectId,
            name: 'Хранилище',
            endpoint: '',
            region: 'auto',
            bucket: '',
            accessKeyId: '',
            secretAccessKey: '',
        },
    });

    const onSubmit = async (values: StorageFormValues) => {
        const { success } = await runAction(mutateAsync(values), {
            success: `Хранилище «${values.name}» подключено`,
        });

        if (success) close();
    };

    return (
        <Modal
            onClose={close}
            busy={isPending}
            title="Подключить хранилище файлов"
            description="Любое S3-совместимое хранилище: Neon, Cloudflare R2, Yandex Object Storage, AWS S3, MinIO. Новые картинки проекта пойдут туда, лимит тарифа на файлы перестанет действовать. Перед сохранением запишем и удалим тестовый файл."
            className="max-w-md"
        >
            <Form
                form={form}
                onSubmit={onSubmit}
                className="grid gap-3"
            >
                <Input<StorageFormValues>
                    name="name"
                    label="Название"
                    autoFocus
                />
                <Input<StorageFormValues>
                    name="endpoint"
                    label="Endpoint"
                    placeholder="https://storage.example.com"
                />
                <Input<StorageFormValues>
                    name="region"
                    label="Регион"
                    placeholder="auto"
                />
                <Input<StorageFormValues>
                    name="bucket"
                    label="Бакет"
                />
                <Input<StorageFormValues>
                    name="accessKeyId"
                    label="Access key ID"
                    autoComplete="off"
                />
                <Input<StorageFormValues>
                    name="secretAccessKey"
                    label="Secret access key"
                    type="password"
                    autoComplete="off"
                />

                <Modal.Footer>
                    <Button
                        type="submit"
                        disabled={isPending}
                    >
                        Подключить
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isPending}
                        onClick={close}
                    >
                        Отмена
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};
