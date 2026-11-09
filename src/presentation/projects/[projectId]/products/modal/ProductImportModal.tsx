'use client';

import { useModalClose } from '@/shared/lib/modal';
import { Modal } from '@/ui/Base';
import { ImportResult } from '../components/ImportResult';
import { ImportUpload } from '../components/ImportUpload';
import { useProductImport } from '../hooks/useProductImport';

export const ProductImportModal = ({ projectId }: { projectId: string }) => {
    const close = useModalClose();
    const { result, rows, setWarehouseId, submit, ...upload } = useProductImport(projectId);

    return (
        <Modal
            onClose={close}
            busy={upload.isPending}
            title="Импорт товаров"
            description="CSV из Excel или другой системы. Товар с тем же артикулом обновится, новый — создастся."
            className="max-w-lg"
        >
            {result ? (
                <ImportResult
                    result={result}
                    onDone={close}
                />
            ) : (
                <ImportUpload
                    {...upload}
                    rowsCount={rows.length}
                    onWarehouseChange={setWarehouseId}
                    onSubmit={() => void submit()}
                />
            )}
        </Modal>
    );
};
