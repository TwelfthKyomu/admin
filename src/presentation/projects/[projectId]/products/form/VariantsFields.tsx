'use client';

import { variantComboKey, variantComboLabel } from '@/contexts/product';
import { Button } from '@/ui/Base';
import { Checkbox, Input, Money, TagsInput } from '@/ui/Controlled';
import { Plus, Trash2, Wand2 } from 'lucide-react';
import { useVariantsFields } from '../hooks/useVariantsFields';

export const VariantsFields = () => {
    const {
        optionFields,
        variants,
        canAddOption,
        missingSuggestions,
        addOption,
        removeOption,
        generateVariants,
        hasOptions,
    } = useVariantsFields();

    return (
        <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-muted-foreground text-sm">
                    Цвет, размер и другие развилки товара. Из комбинаций значений строятся варианты
                    — у каждого свой SKU и цена.
                </p>
                <div className="flex gap-2">
                    {missingSuggestions.map((name) => (
                        <Button
                            key={name}
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!canAddOption}
                            onClick={() => addOption(name)}
                        >
                            <Plus />
                            {name}
                        </Button>
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!canAddOption}
                        onClick={() => addOption('')}
                    >
                        <Plus />
                        Опция
                    </Button>
                </div>
            </div>

            {optionFields.map((field, index) => (
                <div
                    key={field.id}
                    className="grid grid-cols-[1fr_2fr_auto] items-start gap-2"
                >
                    <Input
                        name={`options.${index}.name`}
                        label="Опция"
                        placeholder="Цвет"
                        autoComplete="off"
                    />
                    <TagsInput
                        name={`options.${index}.values`}
                        label="Значения"
                        placeholder="Красный, Синий…"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-6"
                        aria-label="Удалить опцию"
                        onClick={() => removeOption(index)}
                    >
                        <Trash2 />
                    </Button>
                </div>
            ))}

            {hasOptions && (
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="justify-self-start"
                    onClick={generateVariants}
                >
                    <Wand2 />
                    Сгенерировать варианты
                </Button>
            )}

            {variants.map((variant, index) => (
                <div
                    key={variantComboKey(variant.optionValues)}
                    className="grid grid-cols-[minmax(0,1fr)_1fr_1fr_auto] items-end gap-2 rounded-md border border-border p-2"
                >
                    <span className="self-center truncate text-sm">
                        {variantComboLabel(variant.optionValues)}
                    </span>
                    <Input
                        name={`variants.${index}.sku`}
                        label="SKU"
                        placeholder="Как у товара"
                        autoComplete="off"
                    />
                    <Money
                        name={`variants.${index}.price`}
                        label="Цена"
                        placeholder="Как у товара"
                    />
                    <Checkbox
                        name={`variants.${index}.isActive`}
                        label="Активен"
                    />
                </div>
            ))}
        </div>
    );
};
