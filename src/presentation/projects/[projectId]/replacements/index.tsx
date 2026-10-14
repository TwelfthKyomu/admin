'use client';

import { PageHeader, QueryBoundary } from '@/shared/components/common';
import { KindFilter } from '../components/KindFilter';
import { OwnShifts } from './components/OwnShifts';
import { SeekingShiftCard } from './components/SeekingShiftCard';
import { useReplacementsPage } from './hooks/useReplacementsPage';

export const ReplacementsPage = () => {
    const {
        query,
        currency,
        seeking,
        ownShifts,
        isOwnShiftsLoading,
        canAssign,
        kind,
        setKind,
        candidatesFor,
        onAssign,
        onToggleSeeking,
        isTogglingSeeking,
    } = useReplacementsPage();

    return (
        <>
            <PageHeader
                title="Биржа подмен"
                description="Смены, на которые ищут замену. Записи и доставки в окне смены перейдут тому, кто её возьмёт."
                actions={
                    <KindFilter
                        value={kind}
                        onChange={setKind}
                    />
                }
            />
            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <section className="grid gap-3">
                    <span className="text-[13px] font-semibold">
                        Ищут замену · {seeking.length}
                    </span>
                    <QueryBoundary
                        query={query}
                        errorTitle="Не удалось загрузить смены"
                        isEmpty={() => seeking.length === 0}
                        empty={
                            <p className="rounded-xl border border-dashed border-border p-6 text-center text-[13px] text-muted-foreground">
                                Сейчас никто не ищет замену.
                            </p>
                        }
                    >
                        {() =>
                            seeking.map((shift) => (
                                <SeekingShiftCard
                                    key={shift.id}
                                    shift={shift}
                                    candidates={candidatesFor(shift)}
                                    currency={currency}
                                    canAssign={canAssign}
                                    onAssign={onAssign}
                                />
                            ))
                        }
                    </QueryBoundary>
                </section>
                <OwnShifts
                    title={canAssign ? 'Запланированные смены' : 'Мои смены'}
                    shifts={ownShifts}
                    showOwners={canAssign}
                    isLoading={isOwnShiftsLoading}
                    isPending={isTogglingSeeking}
                    onToggle={onToggleSeeking}
                />
            </div>
        </>
    );
};
