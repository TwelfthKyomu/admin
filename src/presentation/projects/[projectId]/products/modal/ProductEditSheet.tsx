'use client';

import { FormDialog } from '@/shared/components/common';
import type { ProductView } from '@/contexts/product';
import { ProductEditor } from '../form/ProductEditor';
import { useProductEditSheet } from '../hooks/useProductEditSheet';

interface ProductEditSheetProps {
    projectId: string;
    product: ProductView;
}

export const ProductEditSheet = ({ projectId, product }: ProductEditSheetProps) => {
    const { isPending, form, onSubmit } = useProductEditSheet(projectId, product);

    return (
        <FormDialog
            surface="sheet"
            title="Изменить товар"
            description={product.name}
            className="data-[side=right]:w-full data-[side=right]:sm:max-w-5xl"
            footerClassName="sticky bottom-0 -mx-4 border-t bg-popover px-4 py-3"
            form={form}
            onSubmit={onSubmit}
            submitLabel="Сохранить"
            busy={isPending}
        >
            <ProductEditor
                projectId={projectId}
                isNew={false}
            />
        </FormDialog>
    );
};
