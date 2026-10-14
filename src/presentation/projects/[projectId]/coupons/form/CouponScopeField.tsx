import { useController, useFormContext } from 'react-hook-form';
import { COUPON_SCOPE_RULES_MAX, type CouponScopeRule } from '@/contexts/coupon';
import { useProductsList } from '@/contexts/product';
import { useCategoriesList } from '@/contexts/projectCategory';
import { Badge, Button, Combobox, Field, FieldError, FieldLabel } from '@/ui/Base';

const SCOPE_FIELD = 'scope.rules';

function ruleTargetId(rule: CouponScopeRule): string {
    return rule.type === 'product' ? rule.productId : rule.categoryId;
}

export const CouponScopeField = ({ projectId }: { projectId: string }) => {
    const { control } = useFormContext();

    const {
        field,
        fieldState: { error, invalid },
    } = useController({ name: SCOPE_FIELD, control });

    const categories = useCategoriesList({ projectId, includeInactive: true }).data ?? [];
    const products = useProductsList({ projectId }).data ?? [];

    const rules = (field.value as CouponScopeRule[] | undefined) ?? [];
    const selectedIds = new Set(rules.map(ruleTargetId));
    const canAdd = rules.length < COUPON_SCOPE_RULES_MAX;

    const categoryOptions = categories
        .filter((category) => !selectedIds.has(category.id))
        .map((category) => ({ value: category.id, label: category.name }));

    const productOptions = products
        .filter((product) => !selectedIds.has(product.id))
        .map((product) => ({
            value: product.id,
            label: product.name,
            keywords: product.sku ? [product.sku] : undefined,
        }));

    const ruleLabel = (rule: CouponScopeRule): string => {
        if (rule.type === 'category') {
            const name = categories.find((category) => category.id === rule.categoryId)?.name;

            return `Категория: ${name ?? 'удалена'}`;
        }

        const name = products.find((product) => product.id === rule.productId)?.name;

        return `Товар: ${name ?? 'удалён'}`;
    };

    const addRule = (rule: CouponScopeRule) => field.onChange([...rules, rule]);

    const removeRule = (targetId: string) =>
        field.onChange(rules.filter((rule) => ruleTargetId(rule) !== targetId));

    return (
        <Field data-invalid={invalid}>
            <FieldLabel>Действует на</FieldLabel>
            {rules.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                    {rules.map((rule) => (
                        <Badge
                            key={ruleTargetId(rule)}
                            variant="secondary"
                            className="gap-1"
                        >
                            {ruleLabel(rule)}
                            <Button
                                type="button"
                                size="icon-xs"
                                variant="ghost"
                                className="-mr-1 size-4"
                                aria-label={`Убрать «${ruleLabel(rule)}»`}
                                onClick={() => removeRule(ruleTargetId(rule))}
                            >
                                ×
                            </Button>
                        </Badge>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground text-sm">
                    Весь заказ. Добавьте категории или товары, чтобы сузить скидку.
                </p>
            )}
            {canAdd && (
                <div className="grid grid-cols-2 gap-3">
                    <Combobox
                        options={categoryOptions}
                        onValueChange={(categoryId) => addRule({ type: 'category', categoryId })}
                        placeholder="+ Категория"
                        searchPlaceholder="Найти категорию…"
                        emptyText="Категорий нет"
                    />
                    <Combobox
                        options={productOptions}
                        onValueChange={(productId) => addRule({ type: 'product', productId })}
                        placeholder="+ Товар"
                        searchPlaceholder="Название или артикул…"
                        emptyText="Товаров нет"
                    />
                </div>
            )}
            {error && <FieldError errors={[error]} />}
        </Field>
    );
};
