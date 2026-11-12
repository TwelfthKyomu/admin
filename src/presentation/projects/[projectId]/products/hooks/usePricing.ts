'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import { DEFAULT_CURRENCY } from '@/shared/constants/currency';
import type { CreateProductFormValues } from '../form/formData';
import { marginLabel } from '../lib/margin';

export const usePricing = () => {
    const { control } = useFormContext<CreateProductFormValues>();

    const [price, cost, currency] = useWatch({
        control,
        name: ['price', 'costAmount', 'currency'],
    });

    return { margin: marginLabel(price, cost, currency ?? DEFAULT_CURRENCY) };
};
