'use client';

import { useState } from 'react';
import { useProject } from '@/app/providers';
import { confirmDestructive, modal } from '@/shared/lib/modal';
import {
    IntegrationType,
    type IntegrationView,
    useIntegrationsList,
    useRevokeIntegration,
} from '@/contexts/integration';
import dynamic from 'next/dynamic';

const PaymentProviderConnectModal = dynamic(() =>
    import('../modal/PaymentProviderConnectModal').then((m) => m.PaymentProviderConnectModal),
);

const StorageConnectModal = dynamic(() =>
    import('../modal/StorageConnectModal').then((m) => m.StorageConnectModal),
);

const IntegrationCreateModal = dynamic(() =>
    import('../modal/IntegrationCreateModal').then((m) => m.IntegrationCreateModal),
);

export function useIntegrationsPage() {
    const { projectId } = useProject();
    const [issuedKey, setIssuedKey] = useState<string>();
    const query = useIntegrationsList(projectId);
    const revoke = useRevokeIntegration(projectId);

    const onCreate = () =>
        modal.open(
            <IntegrationCreateModal
                projectId={projectId}
                onIssued={setIssuedKey}
            />,
        );

    const onConnectProvider = () =>
        modal.open(<PaymentProviderConnectModal projectId={projectId} />);

    const onConnectStorage = () => modal.open(<StorageConnectModal projectId={projectId} />);

    const onRevoke = (integration: IntegrationView) => {
        const isStorage = integration.type === IntegrationType.STORAGE;

        return confirmDestructive({
            title: isStorage ? 'Отключить хранилище?' : 'Отозвать ключ?',
            description: isStorage ? (
                <>
                    Новые файлы пойдут в общее хранилище. Файлы из{' '}
                    <strong>«{integration.name}»</strong> перестанут открываться.
                </>
            ) : (
                <>
                    Подключение <strong>«{integration.name}»</strong> перестанет получать данные.
                    Чтобы возобновить — выпустите новый ключ.
                </>
            ),
            confirmLabel: isStorage ? 'Отключить' : 'Отозвать',
            success: isStorage ? 'Хранилище отключено' : 'Ключ отозван',
            onConfirm: () => revoke.mutateAsync({ projectId, integrationId: integration.id }),
        });
    };

    return {
        query,
        issuedKey,
        onDismissIssuedKey: () => setIssuedKey(undefined),
        onCreate,
        onConnectProvider,
        onConnectStorage,
        onRevoke,
        isRevoking: revoke.isPending,
    };
}
