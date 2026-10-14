import { cn } from '@/shared/lib/utils';
import { Spinner } from '@/ui/Base';

interface PageLoaderProps {
    className?: string;
}

export const PageLoader = ({ className }: PageLoaderProps) => (
    <div className={cn('flex flex-1 items-center justify-center py-20', className)}>
        <Spinner className="size-5 text-muted-foreground" />
    </div>
);
