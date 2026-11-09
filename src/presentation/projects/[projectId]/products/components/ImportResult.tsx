import type { ProductImportResult } from '@/contexts/product';
import { Button } from '@/ui/Base';
import { ImportIssues } from './ImportIssues';

interface ImportResultProps {
    result: ProductImportResult;
    onDone: () => void;
}

export const ImportResult = ({ result, onDone }: ImportResultProps) => (
    <div className="grid gap-4">
        <p className="text-sm">
            Создано: {result.created}. Обновлено: {result.updated}. Не загружено:{' '}
            {result.failed.length}.
        </p>
        <ImportIssues
            issues={result.failed.map((failure) => ({
                key: failure.sku,
                label: failure.sku,
                message: failure.message,
            }))}
        />
        <Button
            type="button"
            onClick={onDone}
        >
            Готово
        </Button>
    </div>
);
