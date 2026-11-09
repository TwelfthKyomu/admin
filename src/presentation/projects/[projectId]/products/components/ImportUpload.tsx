import { pluralRu } from '@/shared/format/plural';
import {
    type ParsedImportRow,
    PRODUCT_IMPORT_HEADER,
    PRODUCT_IMPORT_ROWS_MAX,
} from '@/contexts/product';
import type { WarehouseView } from '@/contexts/warehouse';
import { Button, Input, Select } from '@/ui/Base';
import { downloadImportTemplate } from '../lib/importFile';
import { ImportIssues } from './ImportIssues';

interface ImportUploadProps {
    warehouses: WarehouseView[];
    warehouseId?: string;
    rowsCount: number;
    invalid: ParsedImportRow[];
    tooMany: boolean;
    isPending: boolean;
    onWarehouseChange: (warehouseId: string) => void;
    onFile: (file: File | undefined) => void;
    onSubmit: () => void;
}

export const ImportUpload = ({
    warehouses,
    warehouseId,
    rowsCount,
    invalid,
    tooMany,
    isPending,
    onWarehouseChange,
    onFile,
    onSubmit,
}: ImportUploadProps) => (
    <div className="grid gap-4">
        <p className="text-[13px] text-muted-foreground">
            Колонки: {PRODUCT_IMPORT_HEADER.join(', ')}. Обязательны название, артикул и цена.{' '}
            <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={downloadImportTemplate}
            >
                Скачать шаблон
            </Button>
        </p>
        <Input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => onFile(event.target.files?.[0])}
        />
        {warehouses.length > 1 && (
            <Select
                options={warehouses.map((warehouse) => ({
                    value: warehouse.id,
                    label: `Остаток — на склад «${warehouse.name}»`,
                }))}
                value={warehouseId ?? warehouses[0]?.id}
                onValueChange={onWarehouseChange}
            />
        )}
        <ImportIssues
            issues={invalid.map((line) => ({
                key: String(line.line),
                label: `Строка ${line.line}`,
                message: line.error ?? '',
            }))}
        />
        {tooMany && (
            <p className="text-[13px] text-destructive">
                За раз — не больше {PRODUCT_IMPORT_ROWS_MAX} строк.
            </p>
        )}
        <Button
            type="button"
            disabled={rowsCount === 0 || tooMany || isPending}
            onClick={onSubmit}
        >
            Загрузить {rowsCount} {pluralRu(rowsCount, ['товар', 'товара', 'товаров'])}
        </Button>
    </div>
);
