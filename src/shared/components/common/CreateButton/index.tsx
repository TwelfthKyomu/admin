import { Button } from '@/ui/Base';
import { Plus } from 'lucide-react';

interface CreateButtonProps {
    label: string;
    onClick: () => void;
}

export const CreateButton = ({ label, onClick }: CreateButtonProps) => (
    <Button
        variant="outline"
        onClick={onClick}
    >
        <Plus />
        {label}
    </Button>
);
