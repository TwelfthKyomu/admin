import { Checkbox, Input } from '@/ui/Controlled';

export const WarehouseForm = () => (
    <>
        <Input
            name="name"
            label="Название"
            placeholder="Напр. Склад на Ленина, Магазин"
        />
        <Checkbox
            name="forSite"
            label="Продаётся на сайте"
            description="Остаток этого склада виден покупателям, заказы с сайта бронируют его."
        />
    </>
);
