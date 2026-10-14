interface CardRow {
    label: string;
    value: string;
}

interface CardRowsProps {
    rows: CardRow[];
}

export const CardRows = ({ rows }: CardRowsProps) => (
    <div className="flex flex-col gap-1.5">
        {rows.map((row) => (
            <div
                key={row.label}
                className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-[11px] py-[9px]"
            >
                <span className="text-[12px] leading-[1.2] text-muted-foreground">{row.label}</span>
                <span className="flex-1" />
                <span className="truncate font-mono text-[12.5px] leading-[1.2] font-medium tabular-nums">
                    {row.value}
                </span>
            </div>
        ))}
    </div>
);
