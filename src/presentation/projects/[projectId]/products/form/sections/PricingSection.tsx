import { CURRENCY_OPTIONS } from '@/shared/constants/currency';
import { Money, Select } from '@/ui/Controlled';
import { usePricing } from '../../hooks/usePricing';
import { EditorCard } from './EditorCard';

export const PricingSection = () => {
    const { margin } = usePricing();

    return (
        <EditorCard title="Цена">
            <div className="grid gap-4 sm:grid-cols-3">
                <Money
                    name="price"
                    label="Цена"
                    placeholder="1990,00"
                />
                <Money
                    name="costAmount"
                    label="Закупочная цена"
                    placeholder="Для расчёта маржи"
                />
                <Select
                    name="currency"
                    label="Валюта"
                    options={CURRENCY_OPTIONS}
                />
            </div>
            {margin && <p className="text-[13px] text-muted-foreground">{margin}</p>}
        </EditorCard>
    );
};
