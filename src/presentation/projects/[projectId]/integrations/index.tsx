'use client';

import { QueryBoundary } from '@/shared/components/common';
import { Button, ButtonGroup, Table } from '@/ui/Base';
import { CreditCard, HardDrive, Plus } from 'lucide-react';
import { COLUMNS } from './components/Column';
import { IssuedKeyBanner } from './components/IssuedKeyBanner';
import { useIntegrationsPage } from './hooks/useIntegrationsPage';

export const IntegrationsPage = () => {
    const {
        query,
        issuedKey,
        onDismissIssuedKey,
        onCreate,
        onConnectProvider,
        onConnectStorage,
        onRevoke,
        isRevoking,
    } = useIntegrationsPage();

    return (
        <>
            {issuedKey && (
                <div className="pb-4">
                    <IssuedKeyBanner
                        token={issuedKey}
                        onDismiss={onDismissIssuedKey}
                    />
                </div>
            )}
            <QueryBoundary
                query={query}
                errorTitle="Не удалось загрузить подключения"
            >
                {(integrations) => (
                    <Table
                        columns={COLUMNS({ onRevoke, isRevoking })}
                        customActions={
                            <ButtonGroup>
                                <Button
                                    variant="outline"
                                    onClick={onConnectProvider}
                                >
                                    <CreditCard />
                                    Платёжный провайдер
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={onConnectStorage}
                                >
                                    <HardDrive />
                                    Хранилище
                                </Button>
                                <Button
                                    variant="outline"
                                    aria-label="Подключить сайт"
                                    onClick={onCreate}
                                >
                                    <Plus />
                                </Button>
                            </ButtonGroup>
                        }
                        data={integrations}
                        emptyMessage="Пока нет подключённых сайтов. Создайте первое подключение."
                        getRowId={(integration) => integration.id}
                    />
                )}
            </QueryBoundary>
        </>
    );
};
