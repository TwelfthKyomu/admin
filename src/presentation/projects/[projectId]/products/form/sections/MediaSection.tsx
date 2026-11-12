import { ImagesField } from '../Images';
import { EditorCard } from './EditorCard';

export const MediaSection = ({ projectId }: { projectId: string }) => (
    <EditorCard
        title="Фото"
        description="Первое фото — обложка в каталоге и на сайте."
    >
        <ImagesField projectId={projectId} />
    </EditorCard>
);
