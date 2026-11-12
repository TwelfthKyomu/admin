import { DetailRow } from '@/shared/components/common';
import { Button } from '@/ui/Base';
import { Section } from './Section';

interface SellerSectionProps {
    name: string;
    onChange?: () => void;
}

export const SellerSection = ({ name, onChange }: SellerSectionProps) => (
    <Section
        title="Продавец"
        aside={
            onChange && (
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onChange}
                >
                    Сменить
                </Button>
            )
        }
    >
        <div className="grid gap-1.5 px-4 py-3 text-[13px]">
            <DetailRow
                label="Сотрудник"
                value={name}
            />
        </div>
    </Section>
);
