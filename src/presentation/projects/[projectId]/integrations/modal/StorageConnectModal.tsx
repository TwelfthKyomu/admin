'use client';

import { Button, Modal } from '@/ui/Base';
import { Form, Input } from '@/ui/Controlled';
import type { ConnectStorageFormValues } from '../form/formData';
import { useStorageConnectModal } from '../hooks/useStorageConnectModal';

export const StorageConnectModal = ({ projectId }: { projectId: string }) => {
    const { close, isPending, form, onSubmit } = useStorageConnectModal(projectId);

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
                <Input<ConnectStorageFormValues>
                    name="name"
                    label="Название"
                    autoFocus
                />
                <Input<ConnectStorageFormValues>
                    name="endpoint"
                    label="Endpoint"
                    placeholder="https://storage.example.com"
                />
                <Input<ConnectStorageFormValues>
                    name="region"
                    label="Регион"
                    placeholder="auto"
                />
                <Input<ConnectStorageFormValues>
                    name="bucket"
                    label="Бакет"
                />
                <Input<ConnectStorageFormValues>
                    name="accessKeyId"
                    label="Access key ID"
                    autoComplete="off"
                />
                <Input<ConnectStorageFormValues>
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
