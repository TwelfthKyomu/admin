'use client';

import { CURRENCY_OPTIONS } from '@/shared/constants/currency';
import { FieldGroup } from '@/ui/Base';
import { ColorPicker, Input, Select, Textarea } from '@/ui/Controlled';

export const ProjectForm = () => (
    <FieldGroup>
        <Input
            name="name"
            label="Название"
            placeholder="Например: Магазин одежды"
            autoComplete="off"
            autoFocus
        />
        <Input
            name="slug"
            label="URL-идентификатор"
            placeholder="clothes-store"
            autoComplete="off"
            description="Подставляется из названия, можно поправить."
        />
        <Input
            name="key"
            label="Код проекта"
            placeholder="SHOP"
            autoComplete="off"
            description="Короткий код для номеров заказов, только латиница."
        />
        <Textarea
            name="description"
            label="Описание (необязательно)"
            placeholder="Коротко о проекте"
            rows={2}
        />
        <div className="grid grid-cols-2 gap-3">
            <ColorPicker
                name="color"
                label="Цвет"
            />
            <Select
                name="defaultCurrency"
                label="Валюта проекта"
                description="Сменить можно, пока в проекте нет заказов"
                options={CURRENCY_OPTIONS}
            />
        </div>
    </FieldGroup>
);
