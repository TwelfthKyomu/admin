import { PersonCell } from '@/shared/components/common';
import type { Currency } from '@/shared/constants/currency';
import { fmtMoney } from '@/shared/format/money';
import type { CourierRow } from '../hooks/useDeliveriesPage';

interface CourierSidebarProps {
    couriers: CourierRow[];
    currency: Currency;
}

export const CourierSidebar = ({ couriers, currency }: CourierSidebarProps) => (
    <aside className="grid content-start gap-3 rounded-xl border border-border p-4">
        <div className="grid gap-0.5">
            <span className="text-[13px] font-semibold">Курьеры</span>
            <span className="text-[12px] text-muted-foreground">
                Назначать можно тем, чья смена покрывает окно доставки.
            </span>
        </div>
        {couriers.length === 0 && (
            <p className="text-[13px] text-muted-foreground">
                Курьеров нет — отметьте вид работы «Курьер» на странице «Сотрудники».
            </p>
        )}
        {couriers.map((courier) => (
            <div
                key={courier.employeeId}
                className="grid gap-1.5 border-t border-border pt-2.5"
            >
                <PersonCell
                    name={courier.name}
                    image={courier.image}
                    caption={
                        courier.shiftLabel ? `смена ${courier.shiftLabel}` : 'сегодня без смены'
                    }
                />
                <div className="flex items-center justify-between text-[12px] text-muted-foreground">
                    <span>
                        {courier.inWork} в работе · {courier.delivered} доставлено
                    </span>
                    {courier.onHand !== undefined && (
                        <span
                            className={
                                courier.onHand > 0
                                    ? 'font-medium text-amber-700 dark:text-amber-300'
                                    : undefined
                            }
                        >
                            на руках {fmtMoney(courier.onHand, currency)}
                        </span>
                    )}
                </div>
            </div>
        ))}
    </aside>
);
