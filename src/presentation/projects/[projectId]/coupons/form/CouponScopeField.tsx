import { Badge, Button, Combobox, Field, FieldError, FieldLabel } from '@/ui/Base';
import { useCouponScopeField } from '../hooks/useCouponScopeField';

export const CouponScopeField = ({ projectId }: { projectId: string }) => {
    const {
        ruleItems,
        canAdd,
        categoryOptions,
        productOptions,
        addRule,
        removeRule,
        error,
        invalid,
    } = useCouponScopeField(projectId);

    return (
        <Field data-invalid={invalid}>
            <FieldLabel>Действует на</FieldLabel>
            {ruleItems.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                    {ruleItems.map((item) => (
                        <Badge
                            key={item.id}
                            variant="secondary"
                            className="gap-1"
                        >
                            {item.label}
                            <Button
                                type="button"
                                size="icon-xs"
                                variant="ghost"
                                className="-mr-1 size-4"
                                aria-label={`Убрать «${item.label}»`}
                                onClick={() => removeRule(item.id)}
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
