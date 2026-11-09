import { Widget, WidgetBody, WidgetHeader } from '@/shared/components/common';
import { type ProjectSetupView, type ProjectView, SETUP_STEP_VALUES } from '@/contexts/project';
import { Button } from '@/ui/Base';
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
        <WidgetHeader
            icon={
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto px-2 py-0.5 text-[11px]"
                    onClick={() => onHide(setup.projectId)}
                >
                    Скрыть
                </Button>
            }
        >
            Первые шаги{project ? ` · ${project.name}` : ''}
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
