import type { ComponentProps, ReactNode } from 'react';
import type { Option } from '@/shared/types';
import type { Select as SelectPrimitive } from 'radix-ui';
import {
    Select as BaseSelect,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './primitives';

type RadixRootProps = ComponentProps<typeof SelectPrimitive.Root>;

type SelectOptionsProps<TValue extends string> = Omit<
    RadixRootProps,
    'children' | 'value' | 'defaultValue' | 'onValueChange'
> & {
    options: ReadonlyArray<Option<TValue>>;
    value?: TValue;
    defaultValue?: TValue;
    onValueChange?: (value: TValue) => void;
    placeholder?: ReactNode;
    size?: 'sm' | 'default';
    triggerClassName?: string;
    contentClassName?: string;
    itemClassName?: string;
};

export const Select = <TValue extends string = string>({
    options,
    placeholder,
    size = 'default',
    triggerClassName,
    contentClassName,
    itemClassName,
    value,
    defaultValue,
    onValueChange,
    ...props
}: SelectOptionsProps<TValue>) => {
    return (
        <BaseSelect
            {...props}
            value={value}
            defaultValue={defaultValue}
            onValueChange={(next) => onValueChange?.(next as TValue)}
        >
            <SelectTrigger
                size={size}
                className={triggerClassName}
            >
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className={contentClassName}>
                {options.map((option) => (
                    <SelectItem
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                        className={itemClassName}
                    >
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </BaseSelect>
    );
};
