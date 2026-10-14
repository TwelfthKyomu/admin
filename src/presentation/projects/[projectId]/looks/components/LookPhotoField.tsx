import { useRef } from 'react';
import { cn } from '@/shared/lib/utils';
import { Button, Combobox, Field, FieldError, FieldLabel } from '@/ui/Base';
import { Upload, X } from 'lucide-react';
import { useLookPhotoField } from '../hooks/useLookPhotoField';

export const LookPhotoField = ({ projectId }: { projectId: string }) => {
    const fileRef = useRef<HTMLInputElement>(null);

    const {
        image,
        imageError,
        isUploading,
        items,
        activeIndex,
        setActiveIndex,
        canAdd,
        productOptions,
        productName,
        upload,
        addProduct,
        place,
        remove,
    } = useLookPhotoField(projectId);

    return (
        <Field data-invalid={Boolean(imageError)}>
            <FieldLabel>Фото и товары на нём</FieldLabel>

            {image && (
                <button
                    type="button"
                    className={cn(
                        'relative block w-full overflow-hidden rounded-md border',
                        activeIndex === undefined ? 'cursor-default' : 'cursor-crosshair',
                    )}
                    onClick={place}
                    aria-label="Отметить место товара на фото"
                >
                    {/* biome-ignore lint/performance/noImgElement: фото образа отдаёт /files или внешняя ссылка */}
                    <img
                        src={image}
                        alt=""
                        className="w-full"
                    />
                    {items.map((item, index) => (
                        <span
                            key={item.productId}
                            className={cn(
                                'absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xs font-semibold ring-2 ring-white',
                                index === activeIndex
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-foreground text-background',
                            )}
                            style={{ left: `${item.x}%`, top: `${item.y}%` }}
                        >
                            {index + 1}
                        </span>
                    ))}
                </button>
            )}

            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    disabled={isUploading}
                    onClick={() => fileRef.current?.click()}
                >
                    <Upload className="size-4" />
                    {image ? 'Заменить фото' : 'Загрузить фото'}
                </Button>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    hidden
                    onChange={(event) => {
                        const [file] = Array.from(event.target.files ?? []);

                        event.target.value = '';
                        void upload(file);
                    }}
                />
                {image && canAdd && (
                    <Combobox
                        options={productOptions}
                        onValueChange={addProduct}
                        placeholder="+ Товар на фото"
                        searchPlaceholder="Название или артикул…"
                        emptyText="Товаров нет"
                    />
                )}
            </div>

            {image && (
                <p className="text-muted-foreground text-sm">
                    {activeIndex === undefined
                        ? 'Добавьте товар и нажмите на фото там, где он виден.'
                        : `Нажмите на фото там, где находится товар №${activeIndex + 1}.`}
                </p>
            )}

            {items.length > 0 && (
                <ol className="flex flex-col gap-1">
                    {items.map((item, index) => (
                        <li
                            key={item.productId}
                            className="flex items-center gap-2 text-sm"
                        >
                            <span className="text-muted-foreground w-5">{index + 1}.</span>
                            <span className="flex-1 truncate">{productName(item.productId)}</span>
                            <Button
                                type="button"
                                size="sm"
                                variant={index === activeIndex ? 'default' : 'ghost'}
                                onClick={() => setActiveIndex(index)}
                            >
                                Указать на фото
                            </Button>
                            <Button
                                type="button"
                                size="icon-xs"
                                variant="ghost"
                                aria-label={`Убрать «${productName(item.productId)}»`}
                                onClick={() => remove(index)}
                            >
                                <X className="size-3" />
                            </Button>
                        </li>
                    ))}
                </ol>
            )}

            {imageError && <FieldError errors={[imageError]} />}
        </Field>
    );
};
