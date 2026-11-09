import { Widget, WidgetBody, WidgetHeader } from '@/shared/components/common';
import { type ProjectSetupView, type ProjectView, SETUP_STEP_VALUES } from '@/contexts/project';
import { Button } from '@/ui/Base';
import { Rocket } from 'lucide-react';
import { SetupStepRow } from './SetupStepRow';

interface SetupChecklistProps {
    setup: ProjectSetupView;
    project?: ProjectView;
    onHide: (projectId: string) => void;
}

export const SetupChecklist = ({ setup, project, onHide }: SetupChecklistProps) => (
    <Widget
        padding="md"
        className="gap-3"
    >
        <WidgetHeader icon={<Rocket className="size-4" />}>
            Первые шаги{project ? ` · ${project.name}` : ''}
            <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => onHide(setup.projectId)}
            >
                Скрыть
            </Button>
        </WidgetHeader>
        <WidgetBody>
            <ul className="grid gap-1 sm:grid-cols-2">
                {SETUP_STEP_VALUES.map((step) => (
                    <SetupStepRow
                        key={step}
                        step={step}
                        projectId={setup.projectId}
                        done={setup.done.includes(step)}
                    />
                ))}
            </ul>
        </WidgetBody>
    </Widget>
);
