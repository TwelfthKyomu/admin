import { Input } from '@/ui/Controlled';
import { EditorCard } from './EditorCard';

export const InventorySection = ({ withStock }: { withStock: boolean }) => (
    <EditorCard
        title="Учёт"
        description="Остаток меняется на вкладке «Склады», там каждое изменение попадает в журнал."
    >
        <Input
            name="sku"
            label="Артикул"
            placeholder="HOODIE-LOGO-01"
            autoComplete="off"
        />
        <Input
            name="barcode"
            label="Штрихкод"
            placeholder="Сканируйте или введите"
            autoComplete="off"
        />
        {withStock && (
            <Input
                name="stock"
                label="Начальный остаток"
                description="Пусто — остаток не отслеживается"
                type="number"
                min="0"
                step="1"
                placeholder="Не учитывать"
            />
        )}
    </EditorCard>
);
