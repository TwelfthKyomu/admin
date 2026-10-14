import { Button, ButtonGroup } from '@/ui/Base';
import { Plus } from 'lucide-react';

interface CreateButtonProps {
    onClick: () => void;
}

export const CreateButton = ({ onClick }: CreateButtonProps) => (
    <ButtonGroup>
        <Button
            variant="outline"
            aria-label="Создать"
            onClick={onClick}
        >
            <Plus />
        </Button>
    </ButtonGroup>
);
