'use client';

import { PageHeader, QueryBoundary, StatsRow } from '@/shared/components/common';
import { Button, Input, type TabItem, Table, Tabs } from '@/ui/Base';
import { Plus } from 'lucide-react';
import { KindFilter } from '../components/KindFilter';
import { COLUMNS, ENDED_COLUMNS } from './components/Column';
import { InvitePanel } from './components/InvitePanel';
import { type MemberStatusFilterValue, useMembersPage } from './hooks/useMembersPage';

const STATUS_TABS: TabItem<MemberStatusFilterValue>[] = [
    { value: 'active', label: 'Работают' },
    { value: 'ended', label: 'Ушли' },
];

export const MembersPage = () => {
    const {
        membersQuery,
        employeesQuery,
        members,
        ended,
        stats,
        search,
        setSearch,
        status,
        setStatus,
        kind,
        setKind,
        currentUserId,
        currency,
        canManageRoles,
        canManageStaff,
        onInvite,
        onChangeRole,
        onToggleBookable,
        onAddToSchedule,
        onDetach,
    } = useMembersPage();

    return (
        <>
            <PageHeader
                title="Сотрудники"
                description="Кто работает в проекте: роль (от неё зависят доступ и вид работы), ставки и готовность брать записи или доставки."
                actions={
                    <Button
                        size="sm"
                        onClick={onInvite}
                    >
                        <Plus />
                        Пригласить
                    </Button>
                }
            />
            <StatsRow items={stats} />
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <Input
                    className="max-w-xs"
                    placeholder="Найти сотрудника…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />
                <KindFilter
                    value={kind}
                    onChange={setKind}
                />
                <Tabs<MemberStatusFilterValue>
                    items={STATUS_TABS}
                    value={status}
                    onValueChange={setStatus}
                />
            </div>
            {status === 'active' ? (
                <QueryBoundary
                    query={membersQuery}
                    errorTitle="Не удалось загрузить сотрудников"
                >
                    {() => (
                        <Table
                            columns={COLUMNS({
                                currentUserId,
                                currency,
                                canManageRoles,
                                canManageStaff,
                                onChangeRole,
                                onToggleBookable,
                                onAddToSchedule,
                                onDetach,
                            })}
                            data={members}
                            emptyMessage="Никого не нашли. Пригласите сотрудников по ссылке."
                            getRowId={(member) => member.id}
                        />
                    )}
                </QueryBoundary>
            ) : (
                <QueryBoundary
                    query={employeesQuery}
                    errorTitle="Не удалось загрузить сотрудников"
                >
                    {() => (
                        <Table
                            columns={ENDED_COLUMNS}
                            data={ended}
                            emptyMessage="Никто пока не уходил."
                            getRowId={(employee) => employee.assignmentId}
                        />
                    )}
                </QueryBoundary>
            )}
            <InvitePanel onInvite={onInvite} />
        </>
    );
};
