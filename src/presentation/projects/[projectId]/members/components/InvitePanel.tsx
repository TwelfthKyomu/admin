'use client';

import { INVITE_STATUS_LABEL } from '@/shared/labels/team';
import { inviteStatusAt } from '@/contexts/projectInvite';
import { Badge, Button } from '@/ui/Base';
import { useInvitePanel } from '../hooks/useInvitePanel';
import { copyInviteLink } from '../lib/inviteLink';

export const InvitePanel = ({ onInvite }: { onInvite: () => void }) => {
    const { invites, isPending, revoke } = useInvitePanel();

    return (
        <div className="mt-6 rounded-lg border">
            <div className="flex items-center justify-between border-b px-4 py-3">
                <div>
                    <div className="font-medium">Приглашения по ссылке</div>
                    <div className="text-[12px] text-muted-foreground">
                        Отправьте ссылку сотруднику — он войдёт и присоединится к проекту.
                    </div>
                </div>
                <Button
                    size="sm"
                    onClick={onInvite}
                >
                    Пригласить
                </Button>
            </div>

            <div className="divide-y">
                {invites.length === 0 && (
                    <div className="px-4 py-4 text-center text-sm text-muted-foreground">
                        Приглашений пока нет.
                    </div>
                )}
                {invites.map((invite) => {
                    const status = inviteStatusAt(invite);
                    const active = status === 'pending';

                    return (
                        <div
                            key={invite.id}
                            className="flex items-center justify-between gap-3 px-4 py-2.5"
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <Badge variant={active ? 'secondary' : 'outline'}>
                                        {INVITE_STATUS_LABEL[status]}
                                    </Badge>
                                    <span className="text-[12px] text-muted-foreground">
                                        {invite.email}
                                    </span>
                                </div>
                                {active && (
                                    <div className="mt-1 text-[12px] text-muted-foreground">
                                        Код:{' '}
                                        <span className="font-mono text-sm font-semibold tracking-widest text-foreground">
                                            {invite.verificationCode}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {active && (
                                <div className="flex shrink-0 gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copyInviteLink(invite.token)}
                                    >
                                        Копировать
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        disabled={isPending}
                                        onClick={() => revoke(invite.id)}
                                    >
                                        Отозвать
                                    </Button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
