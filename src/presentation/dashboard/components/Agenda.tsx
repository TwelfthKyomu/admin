import { EmptyState, Widget, WidgetBody, WidgetHeader } from '@/shared/components/common';
import type { ProjectView } from '@/contexts/project';
import { CalendarClock } from 'lucide-react';
import type { AgendaItem } from '../lib/myDay';
import { AgendaRow } from './AgendaRow';

interface AgendaProps {
    items: AgendaItem[];
    projectById: Map<string, ProjectView>;
}

export const Agenda = ({ items, projectById }: AgendaProps) => {
    const now = new Date();

    return (
        <Widget
            padding="md"
            className="gap-3"
        >
            <WidgetHeader icon={<CalendarClock className="size-4" />}>
                Сегодня — смены и записи
            </WidgetHeader>
            <WidgetBody>
                {items.length === 0 ? (
                    <EmptyState
                        icon={CalendarClock}
                        title="На сегодня ничего не назначено"
                        description="Смены и записи клиентов к вам появятся здесь, как только их поставят в расписание."
                        className="py-6"
                    />
                ) : (
                    <ol className="flex flex-col">
                        {items.map((item) => (
                            <AgendaRow
                                key={`${item.kind}:${item.id}`}
                                item={item}
                                project={projectById.get(item.projectId)}
                                now={now}
                            />
                        ))}
                    </ol>
                )}
            </WidgetBody>
        </Widget>
    );
};
