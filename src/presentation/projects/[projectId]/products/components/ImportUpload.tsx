import { pluralRu } from '@/shared/format/plural';
import {
    type ParsedImportRow,
    PRODUCT_IMPORT_HEADER,
    PRODUCT_IMPORT_ROWS_MAX,
} from '@/contexts/product';
import type { WarehouseView } from '@/contexts/warehouse';
import { Button, Select } from '@/ui/Base';
import { FileUp } from 'lucide-react';
import { downloadImportTemplate } from '../lib/importFile';
import { ImportIssues } from './ImportIssues';

interface ImportUploadProps {
    warehouses: WarehouseView[];
    warehouseId?: string;
    fileName?: string;
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
    fileName,
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
        <Button
            asChild
            variant="outline"
        >
            <label className="cursor-pointer">
                <FileUp />
                {fileName ?? 'Выбрать CSV-файл'}
                <input
                    type="file"
                    accept=".csv,text/csv"
                    className="sr-only"
                    onChange={(event) => onFile(event.target.files?.[0])}
                />
            </label>
        </Button>
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
