import { Button } from '@/ui/Base';

interface ShiftActionsProps {
    isOpen: boolean;
    onOpen: () => void;
    onCollect: () => void;
    onClose: () => void;
}

export const ShiftActions = ({ isOpen, onOpen, onCollect, onClose }: ShiftActionsProps) => {
    if (!isOpen) {
        return (
            <Button
                size="sm"
                onClick={onOpen}
            >
                Открыть смену
            </Button>
        );
    }

    return (
        <>
            <Button
                size="sm"
                variant="outline"
                onClick={onCollect}
            >
                Инкассация
            </Button>
            <Button
                size="sm"
                onClick={onClose}
            >
                Закрыть смену
            </Button>
        </>
    );
};
