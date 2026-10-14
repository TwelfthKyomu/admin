import { cn } from '@/shared/lib/utils';
import { Marker, MarkerContent } from '@/ui/Base';

interface FeedMarkerProps {
    label: string;
    unread?: boolean;
}

export const FeedMarker = ({ label, unread = false }: FeedMarkerProps) => (
    <Marker
        variant="separator"
        className={cn(
            'mt-3.5 mb-2.5 text-[10px] leading-none font-medium tracking-[0.05em] uppercase',
            unread && 'text-destructive before:bg-destructive/50 after:bg-destructive/50',
        )}
    >
        <MarkerContent>{label}</MarkerContent>
    </Marker>
);
