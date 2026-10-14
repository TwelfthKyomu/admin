'use client';

import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { PRODUCT_OPTIONS_MAX } from '@/contexts/product';
import type { CreateProductFormValues } from '../form/formData';
import { buildVariants } from '../lib/variants';

const SUGGESTED_OPTIONS = ['Цвет', 'Размер'];

export function useVariantsFields() {
    const { control, setValue } = useFormContext<CreateProductFormValues>();
    const optionsArray = useFieldArray({ control, name: 'options' });
    const options = useWatch({ control, name: 'options' }) ?? [];
    const variants = useWatch({ control, name: 'variants' }) ?? [];

    const canAddOption = options.length < PRODUCT_OPTIONS_MAX;

    const missingSuggestions = SUGGESTED_OPTIONS.filter(
        (name) => !options.some((option) => option.name === name),
    );

    const addOption = (name: string) =>
        optionsArray.append({ name, values: [] });

    const generateVariants = () =>
        setValue('variants', buildVariants(options, variants), {
            shouldDirty: true,
        });

    return {
        optionFields: optionsArray.fields,
        variants,
        canAddOption,
        missingSuggestions,
        addOption,
        removeOption: optionsArray.remove,
        generateVariants,
        hasOptions: options.length > 0,
    };
}
