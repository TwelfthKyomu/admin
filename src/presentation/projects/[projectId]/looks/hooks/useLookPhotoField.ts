'use client';

import type { MouseEvent } from 'react';
import { useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { toast } from '@/shared/lib/toast';
import { uploadImage } from '@/shared/lib/uploadImage';
import { LOOK_ITEMS_MAX, LOOK_POINT_MAX } from '@/contexts/look';
import { useProductsList } from '@/contexts/product';
import type { CreateLookFormValues } from '../form/formData';

const CENTER = LOOK_POINT_MAX / 2;

export function useLookPhotoField(projectId: string) {
    const [isUploading, setIsUploading] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number>();
    const { control } = useFormContext<CreateLookFormValues>();

    const { field: image, fieldState: imageState } = useController({
        control,
        name: 'image',
    });

    const { field: itemsField } = useController({ control, name: 'items' });
    const products = useProductsList({ projectId }).data ?? [];

    const items = itemsField.value ?? [];
    const usedIds = new Set(items.map((item) => item.productId));

    const productOptions = products
        .filter((product) => !usedIds.has(product.id))
        .map((product) => ({
            value: product.id,
            label: product.name,
            keywords: product.sku ? [product.sku] : undefined,
        }));

    const productName = (productId: string) =>
        products.find((product) => product.id === productId)?.name ??
        'Товар удалён';

    const upload = async (file: File | undefined) => {
        if (!file) return;

        setIsUploading(true);

        try {
            image.onChange(await uploadImage(projectId, file));
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Не удалось загрузить фото',
            );
        }

        setIsUploading(false);
    };

    const addProduct = (productId: string) => {
        itemsField.onChange([...items, { productId, x: CENTER, y: CENTER }]);
        setActiveIndex(items.length);
    };

    const place = (event: MouseEvent<HTMLButtonElement>) => {
        if (activeIndex === undefined) return;

        const rect = event.currentTarget.getBoundingClientRect();

        const toPoint = (offset: number, size: number) =>
            Math.min(
                LOOK_POINT_MAX,
                Math.max(0, Math.round((offset / size) * LOOK_POINT_MAX)),
            );

        const x = toPoint(event.clientX - rect.left, rect.width);
        const y = toPoint(event.clientY - rect.top, rect.height);

        itemsField.onChange(
            items.map((item, index) =>
                index === activeIndex ? { ...item, x, y } : item,
            ),
        );

        setActiveIndex(undefined);
    };

    const remove = (index: number) => {
        itemsField.onChange(items.filter((_, current) => current !== index));
        setActiveIndex(undefined);
    };

    return {
        image: image.value,
        imageError: imageState.error,
        isUploading,
        items,
        activeIndex,
        setActiveIndex,
        canAdd: items.length < LOOK_ITEMS_MAX,
        productOptions,
        productName,
        upload,
        addProduct,
        place,
        remove,
    };
}
