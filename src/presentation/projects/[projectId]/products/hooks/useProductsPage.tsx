'use client';

import { useState } from 'react';
import { useProject } from '@/app/providers';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { confirmDestructive, modal } from '@/shared/lib/modal';
import { type ProductView, useDeleteProduct, useProductsList } from '@/contexts/product';
import dynamic from 'next/dynamic';

const ProductCreateModal = dynamic(() =>
    import('../modal/ProductCreateModal').then((m) => m.ProductCreateModal),
);

const ProductEditSheet = dynamic(() =>
    import('../modal/ProductEditSheet').then((m) => m.ProductEditSheet),
);

export function useProductsPage() {
    const { projectId } = useProject();
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebouncedValue(search);
    const query = useProductsList({ projectId, search: debouncedSearch });
    const { mutateAsync, isPending } = useDeleteProduct(projectId);

    const onCreate = () => modal.open(<ProductCreateModal projectId={projectId} />);

    const onEdit = (product: ProductView) =>
        modal.open(
            <ProductEditSheet
                projectId={projectId}
                product={product}
            />,
        );

    const onDelete = (product: ProductView) =>
        confirmDestructive({
            title: 'Удалить товар?',
            description: (
                <>
                    Товар <strong>«{product.name}»</strong> будет удалён из каталога и перестанет
                    отдаваться через публичное API.
                </>
            ),
            success: `Товар «${product.name}» удалён`,
            onConfirm: () => mutateAsync({ id: product.id, projectId }),
        });

    const onBulkDelete = (products: ProductView[]) =>
        confirmDestructive({
            title: `Удалить товары (${products.length})?`,
            description:
                'Выбранные товары будут удалены из каталога и перестанут отдаваться через публичное API.',
            success: `Удалено товаров: ${products.length}`,
            onConfirm: async () => {
                for (const product of products) {
                    await mutateAsync({ id: product.id, projectId });
                }
            },
        });

    return {
        query,
        search,
        setSearch,
        onCreate,
        onEdit,
        onDelete,
        onBulkDelete,
        isDeleting: isPending,
    };
}
