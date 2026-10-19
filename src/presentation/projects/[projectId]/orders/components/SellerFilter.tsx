'use client';

import type { Option } from '@/shared/types';
import { Select } from '@/ui/Base';

interface SellerFilterProps {
    value: string;
    options: Option[];
    onChange: (next: string) => void;
}

export const SellerFilter = ({ value, options, onChange }: SellerFilterProps) => (
    <Select
        size="sm"
        value={value}
        onValueChange={onChange}
        options={options}
        triggerClassName="w-44"
    />
);
