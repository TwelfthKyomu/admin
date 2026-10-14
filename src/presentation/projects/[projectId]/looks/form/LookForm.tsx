import { FieldGroup } from '@/ui/Base';
import { Checkbox, Input, Textarea } from '@/ui/Controlled';
import { LookPhotoField } from '../components/LookPhotoField';

export const LookForm = ({ projectId }: { projectId: string }) => (
    <FieldGroup>
        <Input
            name="title"
            label="Название"
            placeholder="Осенний город"
        />
        <Textarea
            name="description"
            label="Описание"
            rows={3}
            placeholder="Пара слов об образе — покажем на сайте"
        />
        <LookPhotoField projectId={projectId} />
        <Checkbox
            name="isActive"
            label="Показывать на сайте"
        />
    </FieldGroup>
);
