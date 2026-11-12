'use client';

import { useState } from 'react';
import { runAction } from '@/shared/lib/action-result';
import {
    type ParsedImportRow,
    PRODUCT_IMPORT_ROWS_MAX,
    type ProductImportResult,
    useImportProducts,
} from '@/contexts/product';
import { useWarehousesList } from '@/contexts/warehouse';
import { readImportFile } from '../lib/importFile';

export const useProductImport = (projectId: string) => {
    const { mutateAsync, isPending } = useImportProducts();
    const warehouses = useWarehousesList(projectId).data ?? [];
    const [parsed, setParsed] = useState<ParsedImportRow[]>([]);
    const [warehouseId, setWarehouseId] = useState<string>();
    const [result, setResult] = useState<ProductImportResult>();
    const [fileName, setFileName] = useState<string>();

    const rows = parsed.flatMap((line) => line.row ?? []);
    const invalid = parsed.filter((line) => line.error);
    const tooMany = rows.length > PRODUCT_IMPORT_ROWS_MAX;

    const onFile = async (file: File | undefined) => {
        setResult(undefined);
        setFileName(file?.name);
        setParsed(file ? await readImportFile(file) : []);
    };

    const submit = async () => {
        const targetId = warehouseId ?? warehouses[0]?.id;

        if (!targetId || rows.length === 0 || tooMany) return;

        const { success, response } = await runAction(
            mutateAsync({ projectId, warehouseId: targetId, rows }),
        );

        if (success && response?.data) setResult(response.data);
    };

    return {
        warehouses,
        warehouseId,
        setWarehouseId,
        rows,
        invalid,
        tooMany,
        result,
        fileName,
        isPending,
        onFile,
        submit,
    };
};
