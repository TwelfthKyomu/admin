'use client';

import { useStaticData } from '@/app/providers';
import { QueryBoundary } from '@/shared/components/common';
import { fmtDateTime } from '@/shared/format/date';
import { AUDIT_ACTION_LABEL, useAuditLogList } from '@/contexts/auditLog';

export const AuditLogPage = () => {
    const { organization } = useStaticData();
    const query = useAuditLogList(organization.id);

    return (
        <QueryBoundary
            query={query}
            errorTitle="Не удалось загрузить журнал"
        >
            {(entries) => (
                <ul className="flex flex-col divide-y divide-border rounded-lg border">
                    {entries.map((entry) => (
                        <li
                            key={entry.id}
                            className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium">{entry.summary}</span>
                                <span className="text-xs text-muted-foreground">
                                    {AUDIT_ACTION_LABEL[entry.action]}
                                    {entry.actorName ?? 'Система'}
                                </span>
                            </div>
                            <time
                                dateTime={entry.createdAt.toISOString()}
                                className="text-xs tabular-nums text-muted-foreground"
                            >
                                {fmtDateTime(entry.createdAt)}
                            </time>
                        </li>
                    ))}
                </ul>
            )}
        </QueryBoundary>
    );
};
