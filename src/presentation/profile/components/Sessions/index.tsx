'use client';

import { QueryBoundary } from '@/shared/components/common';
import { fmtDateTime } from '@/shared/format/date';
import {
    Button,
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemTitle,
} from '@/ui/Base';
import { useSessions } from '../../hooks/useSessions';
import { deviceLabel } from '../../lib/device';

export const SessionsCard = () => {
    const { query, revoke, revokeOthers } = useSessions();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Другие устройства</CardTitle>
                <CardDescription>Где ещё выполнен вход в ваш аккаунт.</CardDescription>
                <CardAction>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={revokeOthers.isPending}
                        onClick={() => revokeOthers.mutate()}
                    >
                        Выйти везде
                    </Button>
                </CardAction>
            </CardHeader>
            <CardContent>
                <QueryBoundary
                    query={query}
                    isEmpty={(sessions) => sessions.length === 0}
                    empty={
                        <p className="text-sm text-muted-foreground">
                            Вы вошли только на этом устройстве.
                        </p>
                    }
                    errorTitle="Не удалось загрузить сеансы"
                >
                    {(sessions) =>
                        sessions.map((session) => (
                            <Item key={session.id}>
                                <ItemContent>
                                    <ItemTitle>{deviceLabel(session.userAgent)}</ItemTitle>
                                    <ItemDescription>
                                        активен {fmtDateTime(session.updatedAt)}
                                    </ItemDescription>
                                </ItemContent>
                                <ItemActions>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={revoke.isPending}
                                        onClick={() => revoke.mutate(session.token)}
                                    >
                                        Завершить
                                    </Button>
                                </ItemActions>
                            </Item>
                        ))
                    }
                </QueryBoundary>
            </CardContent>
        </Card>
    );
};
