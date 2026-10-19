import { Widget, WidgetBody, WidgetHeader } from '@/shared/components/common';
import type { MySalesView } from '@/contexts/order';
import type { ProjectView } from '@/contexts/project';
import { ShoppingBag } from 'lucide-react';
import { MySalesRow } from './MySalesRow';

interface MySalesProps {
    sales: MySalesView[];
    projectById: Map<string, ProjectView>;
}

export const MySales = ({ sales, projectById }: MySalesProps) => (
    <Widget
        padding="md"
        className="gap-3"
    >
        <WidgetHeader icon={<ShoppingBag className="size-4" />}>Мои продажи</WidgetHeader>
        <WidgetBody>
            <ul className="flex flex-col gap-3">
                {sales.map((item) => (
                    <MySalesRow
                        key={item.projectId}
                        item={item}
                        project={projectById.get(item.projectId)}
                    />
                ))}
            </ul>
        </WidgetBody>
    </Widget>
);
