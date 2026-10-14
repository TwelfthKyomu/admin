import { useRef } from 'react';
import { useImagesField } from '@/presentation/projects/[projectId]/products/hooks/useImagesField';
import { Button, Field, FieldLabel, TooltipProvider } from '@/ui/Base';
import { InputGroupButton, InputGroupField } from '@/ui/Base/InputGroup';
import { Upload } from 'lucide-react';
import { ImageThumb } from './Thumb';

export const ImagesField = ({ projectId }: { projectId: string }) => {
    const fileRef = useRef<HTMLInputElement>(null);

    const { images, url, setUrl, isUploading, addUrl, addFiles, removeAt } =
        useImagesField(projectId);

    return (
        <Field>
            <FieldLabel>Картинки</FieldLabel>
            <div className="flex gap-2">
                <InputGroupField
                    value={url}
                    placeholder="https://…/image.jpg"
                    onChange={(event) => setUrl(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key !== 'Enter') return;

                        event.preventDefault();
                        addUrl();
                    }}
                    endAddon={
                        <InputGroupButton
                            type="button"
                            onClick={addUrl}
                        >
                            Добавить
                        </InputGroupButton>
                    }
                />
                <Button
                    type="button"
                    variant="outline"
                    disabled={isUploading}
                    onClick={() => fileRef.current?.click()}
                >
                    <Upload className="size-4" />
                    Загрузить
                </Button>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    hidden
                    onChange={(event) => {
                        const files = Array.from(event.target.files ?? []);

                        event.target.value = '';
                        void addFiles(files);
                    }}
                />
            </div>

            {images.length > 0 && (
                <TooltipProvider>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {images.map((src, index) => (
                            <ImageThumb
                                key={`${src}-${index}`}
                                src={src}
                                onRemove={() => removeAt(index)}
                            />
                        ))}
                    </div>
                </TooltipProvider>
            )}
        </Field>
    );
};
