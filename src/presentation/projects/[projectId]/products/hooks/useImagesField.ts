'use client';

import { useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { toast } from '@/shared/lib/toast';
import { uploadImage } from '@/shared/lib/uploadImage';
import type { CreateProductFormValues } from '../form/formData';

export function useImagesField(projectId: string) {
    const [url, setUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const { control } = useFormContext<CreateProductFormValues>();
    const { field } = useController({ control, name: 'images' });

    const images = field.value ?? [];

    const addUrl = () => {
        const next = url.trim();

        if (!next) return;

        field.onChange([...images, next]);
        setUrl('');
    };

    const addFiles = async (files: File[]) => {
        if (files.length === 0) return;

        setIsUploading(true);

        const uploaded: string[] = [];

        for (const file of files) {
            try {
                uploaded.push(await uploadImage(projectId, file));
            } catch (error) {
                toast.error(
                    error instanceof Error
                        ? error.message
                        : 'Не удалось загрузить файл',
                );
            }
        }

        setIsUploading(false);

        if (uploaded.length > 0) field.onChange([...images, ...uploaded]);
    };

    const removeAt = (index: number) =>
        field.onChange(images.filter((_, current) => current !== index));

    return { images, url, setUrl, isUploading, addUrl, addFiles, removeAt };
}
