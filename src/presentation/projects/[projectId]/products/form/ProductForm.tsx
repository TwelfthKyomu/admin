'use client';

import { CURRENCY_OPTIONS } from '@/shared/constants/currency';
import { PRODUCT_STATUS_OPTIONS, PRODUCT_TYPE_OPTIONS } from '@/shared/labels/catalog';
import { FieldGroup, FieldLegend, FieldSet } from '@/ui/Base';
import { Checkbox, Input, Money, MultiSelect, Select, Textarea } from '@/ui/Controlled';
import { useProductForm } from '../hooks/useProductForm';
import { AttributesFields } from './AttributesFields';
import { ImagesField } from './Images';
import { VariantsFields } from './VariantsFields';

interface ProductFormProps {
    projectId: string;
    mode: 'create' | 'edit';
}

export const ProductForm = ({ projectId, mode }: ProductFormProps) => {
    const { isService, categoryOptions, badgeOptions, onTypeChange } = useProductForm(projectId);

    return (
        <FieldGroup>
            <ImagesField projectId={projectId} />

            <FieldSet className="grid gap-4 sm:grid-cols-2">
                <FieldLegend className="col-span-full">Основное</FieldLegend>
                <div className="col-span-full">
                    <Input
                        name="name"
                        label="Название"
                        placeholder="Худи Logo"
                    />
                </div>
                <Input
                    name="slug"
                    label="URL-идентификатор"
                    placeholder="hoodie-logo"
                    autoComplete="off"
                />
                <Input
                    name="sku"
                    label="SKU"
                    placeholder="HOODIE-LOGO-01"
                    autoComplete="off"
                />
                <Select
                    name="type"
                    label="Тип"
                    options={PRODUCT_TYPE_OPTIONS}
                    onValueChange={onTypeChange}
                />
                <Select
                    name="categoryId"
                    label="Категория"
                    options={categoryOptions}
                />
                <div className="col-span-full">
                    <Textarea
                        name="description"
                        label="Описание"
                        placeholder="Что это, из чего, для кого"
                        rows={3}
                    />
                </div>
            </FieldSet>

            <FieldSet className="grid gap-4 sm:grid-cols-3">
                <FieldLegend className="col-span-full">Цена и склад</FieldLegend>
                <Money
                    name="price"
                    label="Цена"
                    placeholder="1990,00"
                />
                <Select
                    name="currency"
                    label="Валюта"
                    options={CURRENCY_OPTIONS}
                />
                {!isService && mode === 'create' && (
                    <Input
                        name="stock"
                        label="Начальный остаток"
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Не учитывать"
                    />
                )}
                {!isService && (
                    <p className="col-span-full text-muted-foreground text-sm">
                        Пустой остаток — запас не отслеживается. Изменения остатка — на вкладке
                        «Склад», там каждое попадает в журнал.
                    </p>
                )}
            </FieldSet>

            {!isService && (
                <FieldSet className="grid gap-4">
                    <FieldLegend>Характеристики</FieldLegend>
                    <AttributesFields />
                </FieldSet>
            )}

            {!isService && (
                <FieldSet className="grid gap-4">
                    <FieldLegend>Опции и варианты</FieldLegend>
                    <VariantsFields />
                </FieldSet>
            )}

            <FieldSet className="grid gap-4 sm:grid-cols-2">
                <FieldLegend className="col-span-full">Витрина</FieldLegend>
                <Select
                    name="status"
                    label="Статус"
                    description="«По ссылке» — товара нет в каталоге и поиске сайта, но его можно открыть и купить по прямой ссылке"
                    options={PRODUCT_STATUS_OPTIONS}
                />
                <MultiSelect
                    name="badges"
                    label="Бейджи"
                    options={badgeOptions}
                    emptyText="В проекте пока нет бейджей"
                />
                <Checkbox
                    name="isFeatured"
                    label="Рекомендуемый товар"
                />
            </FieldSet>
        </FieldGroup>
    );
};
