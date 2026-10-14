'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import { EDITION_SIZE_DEFAULT } from '@/contexts/product';
import type { CreateProductFormValues } from '../form/formData';

export function useEditionField() {
    const { control, setValue } = useFormContext<CreateProductFormValues>();
    const editionSize = useWatch({ control, name: 'attributes.editionSize' });

    const isLimited = editionSize !== undefined;

    const onLimitedChange = (checked: boolean | 'indeterminate') => {
        setValue(
            'attributes.editionSize',
            checked === true ? EDITION_SIZE_DEFAULT : undefined,
            { shouldDirty: true, shouldValidate: true },
        );
    };

    return { isLimited, onLimitedChange };
}
