'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import { NONE } from '@/shared/lib/none';
import { useProjectEmployees } from '@/contexts/employeeAssignment';
import {
    defaultAttributesFor,
    isCategoryCompatible,
    ProductType,
} from '@/contexts/product';
import { useProjectBadgesList } from '@/contexts/projectBadge';
import { useCategoriesList } from '@/contexts/projectCategory';
import { employeeOptions } from '@/presentation/projects/[projectId]/schedule/lib/employees';
import type { CreateProductFormValues } from '../form/formData';

export function useProductForm(projectId: string) {
    const { control, getValues, setValue } =
        useFormContext<CreateProductFormValues>();

    const type = useWatch({ control, name: 'type' }) ?? ProductType.PHYSICAL;
    const isService = type === ProductType.SERVICE;

    const categoriesQuery = useCategoriesList({
        projectId,
        includeInactive: false,
    });

    const badgesQuery = useProjectBadgesList({
        projectId,
        includeInactive: false,
    });

    const employeesQuery = useProjectEmployees({
        projectId,
        enabled: isService,
    });

    const categories = categoriesQuery.data ?? [];

    const categoryOptions = [
        { value: NONE, label: 'Без категории' },
        ...categories
            .filter((category) => isCategoryCompatible(type, category.type))
            .map((category) => ({ value: category.id, label: category.name })),
    ];

    const badgeOptions = (badgesQuery.data ?? []).map((badge) => ({
        value: badge.code,
        label: badge.label,
    }));

    const performerOptions = employeeOptions(employeesQuery.data ?? []);

    const onTypeChange = (next: ProductType) => {
        setValue(
            'attributes',
            { ...defaultAttributesFor(next), ...getValues('attributes') },
            { shouldValidate: true },
        );

        if (next === ProductType.SERVICE) {
            setValue('stock', undefined, { shouldValidate: true });
        }

        const category = categories.find(
            ({ id }) => id === getValues('categoryId'),
        );

        if (category && !isCategoryCompatible(next, category.type)) {
            setValue('categoryId', NONE, { shouldValidate: true });
        }
    };

    return {
        type,
        isService,
        categoryOptions,
        badgeOptions,
        performerOptions,
        onTypeChange,
    };
}
