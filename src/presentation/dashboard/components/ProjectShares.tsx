import { ColorDot } from '@/shared/components/common';
import { ROUTES } from '@/shared/constants';
import type { Currency } from '@/shared/constants/currency';
import { fmtMoney } from '@/shared/format/money';
import Link from 'next/link';
import type { ProjectShareRow } from '../lib/shares';

interface ProjectSharesProps {
    rows: ProjectShareRow[];
    currency?: Currency;
}

export const ProjectShares = ({ rows, currency }: ProjectSharesProps) => {
    const segments = rows.filter((row) => row.currency === currency && row.share > 0);

    return (
        <div className="flex flex-col gap-3">
            <div
                aria-hidden
                className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted"
            >
                {segments.map((row) => (
                    <span
                        key={row.projectId}
                        className="h-full min-w-1 rounded-full bg-muted-foreground"
                        style={{ width: `${row.share}%`, backgroundColor: row.color }}
                    />
                ))}
            </div>

            <ul className="grid gap-x-8 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
                {rows.map((row) => (
                    <li key={`${row.projectId}:${row.currency}`}>
                        <Link
                            href={ROUTES.project(row.projectId, 'orders')}
                            className="-mx-1.5 flex items-center gap-2 rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                            <ColorDot color={row.color} />
                            <span className="min-w-0 flex-1 truncate">{row.name}</span>
                            <span className="shrink-0 tabular-nums">
                                {fmtMoney(row.revenueAmount, row.currency)}
                            </span>
                            <span className="w-9 shrink-0 text-right text-[11px] text-muted-foreground tabular-nums">
                                {row.share}%
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};
