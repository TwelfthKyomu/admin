import { type FieldPath, type FieldValues, useController, useFormContext } from 'react-hook-form';
import type { Option } from '@/shared/types';
import { Button } from '@/ui/Base';
import { ControlledField } from '../Field';
import { toggleValue } from './lib/toggle';

interface MultiSelectControlledProps<
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>,
> {
    name: TName;
    label?: string;
    description?: string;
    options: ReadonlyArray<Option>;
    emptyText?: string;
}

const MultiSelect = <
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
    name,
    label,
    description,
    options,
    emptyText = 'Нет доступных вариантов',
}: MultiSelectControlledProps<TFieldValues, TName>) => {
    const { control } = useFormContext<TFieldValues>();

    const {
        field,
        fieldState: { error },
    } = useController({ name, control });

    const selected = (field.value as string[] | undefined) ?? [];

    return (
        <ControlledField
            name={name}
            label={label}
            description={description}
            error={error}
        >
            {options.length === 0 ? (
                <p className="text-muted-foreground text-sm">{emptyText}</p>
            ) : (
                <div className="flex flex-wrap gap-1.5">
                    {options.map((option) => {
                        const active = selected.includes(option.value);

                        return (
                            <Button
                                key={option.value}
                                type="button"
                                size="xs"
                                variant={active ? 'default' : 'outline'}
                                aria-pressed={active}
                                onClick={() => field.onChange(toggleValue(selected, option.value))}
                            >
                                {option.label}
                            </Button>
                        );
                    })}
                </div>
            )}
        </ControlledField>
    );
};

export { MultiSelect };
