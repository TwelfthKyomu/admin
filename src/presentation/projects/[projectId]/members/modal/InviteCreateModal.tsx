'use client';

import { FormDialog } from '@/shared/components/common';
import { FieldGroup } from '@/ui/Base';
import { InputGroup, optionalStringTransform } from '@/ui/Controlled';
import { useInviteCreateModal } from '../hooks/useInviteCreateModal';

interface CreateInviteModalProps {
    projectId: string;
}

export const InviteCreateModal = ({ projectId }: CreateInviteModalProps) => {
    const { isPending, form, onSubmit } = useInviteCreateModal(projectId);

    return (
        <FormDialog
            title="Пригласить в проект"
            description="Создайте ссылку-приглашение. Кто перейдёт по ней и войдёт — присоединится к проекту."
            className="max-w-md"
            form={form}
            onSubmit={onSubmit}
            submitLabel="Создать ссылку"
            requireValid={false}
            requireDirty={false}
            busy={isPending}
        >
            <FieldGroup>
                <InputGroup
                    name="email"
                    label="Email (необязательно, для себя)"
                    type="email"
                    placeholder="master@example.com"
                    transform={optionalStringTransform}
                />
            </FieldGroup>
        </FormDialog>
    );
};
