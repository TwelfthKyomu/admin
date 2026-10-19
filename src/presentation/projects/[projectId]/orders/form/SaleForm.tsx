'use client';

import type { FieldArrayWithId } from 'react-hook-form';
import type { Currency } from '@/shared/constants/currency';
import { fmtMoney } from '@/shared/format/money';
import type { Option } from '@/shared/types';
import { Button, FieldGroup, FieldLabel } from '@/ui/Base';
import {
    Combobox,
    DatePicker,
    Input,
    InputGroup,
    Money,
    requiredIntTransform,
    Textarea,
    TimePicker,
} from '@/ui/Controlled';
import { Plus, Trash2 } from 'lucide-react';
import type { CreateSaleFormValues } from './formData';

interface SaleFormProps {
    currency: Currency;
    clientOptions: Option[];
    productOptions: Option[];
    itemFields: FieldArrayWithId<CreateSaleFormValues, 'items'>[];
    totalAmount: number;
    hasService: boolean;
    addItem: () => void;
    removeItem: (index: number) => void;
    onClientChange: (clientId: string) => void;
    onItemChange: (index: number, itemKey: string) => void;
}

export const SaleForm = ({
    currency,
    clientOptions,
    productOptions,
    itemFields,
    totalAmount,
    hasService,
    addItem,
    removeItem,
    onClientChange,
    onItemChange,
}: SaleFormProps) => (
    <FieldGroup>
        <Combobox
            name="clientId"
            label="Клиент"
            options={clientOptions}
            searchPlaceholder="Имя, email или телефон…"
            onValueChange={onClientChange}
        />
        <div className="grid grid-cols-2 gap-3">
            <Input
                name="customerName"
                label="Имя покупателя"
                placeholder="Необязательно"
            />
            <Input
                name="customerPhone"
                label="Телефон"
                placeholder="+7 900 000-00-00"
            />
        </div>

        <div className="grid gap-2">
            <FieldLabel>Позиции</FieldLabel>
            {itemFields.map((field, index) => (
                <div
                    key={field.id}
                    className="grid grid-cols-[1fr_5rem_7rem_auto] items-start gap-2"
                >
                    <Combobox
                        name={`items.${index}.itemKey`}
                        options={productOptions}
                        placeholder="Товар…"
                        searchPlaceholder="Название или артикул…"
                        emptyText="Нет активных товаров"
                        onValueChange={(itemKey) => onItemChange(index, itemKey)}
                    />
                    <InputGroup
                        name={`items.${index}.quantity`}
                        type="number"
                        min="1"
                        step="1"
                        aria-label="Количество"
                        endAddon="шт"
                        transform={requiredIntTransform}
                    />
                    <Money
                        name={`items.${index}.unitPriceAmount`}
                        aria-label="Цена за штуку"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Убрать позицию"
                        disabled={itemFields.length === 1}
                        onClick={() => removeItem(index)}
                    >
                        <Trash2 />
                    </Button>
                </div>
            ))}
            <div className="flex items-center justify-between">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                >
                    <Plus />
                    Позиция
                </Button>
                <span className="font-medium text-sm">
                    Итого: {fmtMoney(totalAmount, currency)}
                </span>
            </div>
        </div>

        {hasService && (
            <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
                <DatePicker<CreateSaleFormValues>
                    name="readyDate"
                    label="Будет готово к"
                />
                <TimePicker<CreateSaleFormValues>
                    name="readyTime"
                    label="Время"
                />
            </div>
        )}

        <Textarea
            name="notes"
            label="Заметка"
            placeholder={hasService ? 'Что сломано, что сделать' : 'Необязательно'}
        />
    </FieldGroup>
);
