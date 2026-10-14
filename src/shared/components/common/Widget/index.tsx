import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const widgetVariants = cva('group/widget relative flex min-w-0 flex-col overflow-hidden', {
    variants: {
        size: {
            sm: 'col-span-1 row-span-1',
            md: 'col-span-2 row-span-1',
            lg: 'col-span-2 row-span-2',
            xl: 'col-span-4 row-span-2',
        },
        tone: {
            plain: 'bg-card text-card-foreground shadow-xs ring-1 ring-foreground/10',
            muted: 'bg-muted text-foreground',
            accent: 'bg-primary text-primary-foreground',
            ghost: 'bg-transparent',
        },
        padding: {
            none: 'p-0',
            sm: 'p-2',
            md: 'p-3',
            lg: 'p-4',
        },
        radius: {
            auto: 'rounded-[var(--wg-radius,0.625rem)]',
            none: 'rounded-none',
            sm: 'rounded-md',
            md: 'rounded-lg',
            lg: 'rounded-xl',
            xl: 'rounded-2xl',
        },
    },
    defaultVariants: {
        size: 'sm',
        tone: 'plain',
        padding: 'sm',
        radius: 'auto',
    },
});

const SPAN_COLS: Record<number, string> = {
    1: 'col-span-1',
    2: 'col-span-2',
    3: 'col-span-3',
    4: 'col-span-4',
    5: 'col-span-5',
    6: 'col-span-6',
};

const SPAN_ROWS: Record<number, string> = {
    1: 'row-span-1',
    2: 'row-span-2',
    3: 'row-span-3',
    4: 'row-span-4',
};

interface WidgetProps extends ComponentProps<'div'>, VariantProps<typeof widgetVariants> {
    span?: { cols: keyof typeof SPAN_COLS; rows: keyof typeof SPAN_ROWS };
}

export const Widget = ({
    size,
    tone,
    padding,
    radius,
    span,
    className,
    children,
    ...props
}: WidgetProps) => (
    <div
        data-slot="widget"
        className={cn(
            widgetVariants({
                size: span ? undefined : size,
                tone,
                padding,
                radius,
            }),
            span && [SPAN_COLS[span.cols], SPAN_ROWS[span.rows]],
            className,
        )}
        {...props}
    >
        {children}
    </div>
);

interface WidgetHeaderProps extends ComponentProps<'div'> {
    icon?: ReactNode;
}

export const WidgetHeader = ({ icon, className, children, ...props }: WidgetHeaderProps) => (
    <div
        data-slot="widget-header"
        className={cn('flex shrink-0 items-start justify-between gap-2', className)}
        {...props}
    >
        <span className="min-w-0 truncate font-medium text-[11px] text-muted-foreground">
            {children}
        </span>
        {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
    </div>
);

export const WidgetBody = ({ className, ...props }: ComponentProps<'div'>) => (
    <div
        data-slot="widget-body"
        className={cn('min-h-0 flex-1 overflow-y-auto', className)}
        {...props}
    />
);
