import { useFormContext, useWatch } from 'react-hook-form';
import { useStaticData } from '@/app/providers';
import { CURRENCY_SYMBOL, DEFAULT_CURRENCY } from '@/shared/constants/currency';
import { COUPON_DISCOUNT_TYPE_OPTIONS, COUPON_STATUS_OPTIONS } from '@/shared/labels/catalog';
import { CouponDiscountType } from '@/contexts/coupon';
import { FieldGroup } from '@/ui/Base';
import {
    DatePicker,
    Input,
    InputGroup,
    moneyTransform,
    optionalIntTransform,
    requiredIntTransform,
    Select,
} from '@/ui/Controlled';
import { CouponScopeField } from './CouponScopeField';

export const CouponForm = ({ projectId }: { projectId: string }) => {
    const { projects } = useStaticData();
    const { control, setValue } = useFormContext();
    const discountType = useWatch({ control, name: 'discountType' });

    const isPercent = discountType === CouponDiscountType.PERCENTAGE;

    const currency =
        projects?.find((project) => project.id === projectId)?.defaultCurrency ?? DEFAULT_CURRENCY;

    return (
        <FieldGroup>
            <Input
                name="code"
                label="Код"
                placeholder="SUMMER-10"
                description="A-Z, 0-9, дефис, 3-32 символа"
                autoFocus
            />
            <Input
                name="label"
                label="Название"
                placeholder="Летняя скидка 10%"
            />

            <div className="grid grid-cols-2 gap-3">
                <Select
                    name="discountType"
                    label="Тип скидки"
                    options={COUPON_DISCOUNT_TYPE_OPTIONS}
                    onValueChange={() =>
                        setValue('discountValue', undefined, { shouldValidate: true })
                    }
                />
                <InputGroup
                    name="discountValue"
                    label={isPercent ? 'Процент' : 'Сумма'}
                    type="number"
                    min="0"
                    max={isPercent ? 100 : undefined}
                    step={isPercent ? '1' : '0.01'}
                    endAddon={isPercent ? '%' : CURRENCY_SYMBOL[currency]}
                    transform={isPercent ? requiredIntTransform : moneyTransform}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <Select
                    name="status"
                    label="Статус"
                    options={COUPON_STATUS_OPTIONS}
                />
                <InputGroup
                    name="minOrderAmount"
                    label="Мин. сумма"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Без минимума"
                    endAddon={CURRENCY_SYMBOL[currency]}
                    transform={moneyTransform}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <InputGroup
                    name="maxUses"
                    label="Лимит применений"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Безлимит"
                    transform={optionalIntTransform}
                />
                <InputGroup
                    name="maxUsesPerClient"
                    label="На одного клиента"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Безлимит"
                    transform={optionalIntTransform}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <DatePicker
                    name="validFrom"
                    label="Действует с"
                />
                <DatePicker
                    name="validUntil"
                    label="Действует до"
                />
            </div>

            <CouponScopeField projectId={projectId} />
        </FieldGroup>
    );
};
