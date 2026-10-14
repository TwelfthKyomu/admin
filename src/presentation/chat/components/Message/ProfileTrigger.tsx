import type { ReactNode } from 'react';

interface ProfileTriggerProps {
    userId?: string;
    onOpenProfile: (userId: string) => void;
    label: string;
    children: ReactNode;
}

export const ProfileTrigger = ({ userId, onOpenProfile, label, children }: ProfileTriggerProps) => {
    if (!userId) return <>{children}</>;

    return (
        <button
            type="button"
            onClick={() => onOpenProfile(userId)}
            aria-label={label}
            className="shrink-0 cursor-pointer rounded-lg hover:opacity-80"
        >
            {children}
        </button>
    );
};
