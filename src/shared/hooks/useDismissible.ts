import { useState } from 'react';

interface DismissibleOptions {
    onClose?: () => void;
    canClose?: () => Promise<boolean>;
    busy?: boolean;
}

export const useDismissible = ({
    onClose,
    canClose,
    busy,
}: DismissibleOptions) => {
    const [open, setOpen] = useState(true);

    const close = () => {
        setOpen(false);
        onClose?.();
    };

    const onOpenChange = async (next: boolean) => {
        if (next || busy) return;
        if (!canClose || (await canClose())) close();
    };

    return { open, close, onOpenChange };
};
