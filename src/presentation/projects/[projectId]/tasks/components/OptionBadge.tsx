import type { TaskOptionMeta } from '../lib/taskOptions';

export const OptionBadge = ({ meta }: { meta: TaskOptionMeta }) => (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-medium">
        <meta.icon
            className="size-3.5 shrink-0"
            style={{ color: meta.color }}
        />
        <span className="truncate">{meta.label}</span>
    </span>
);
