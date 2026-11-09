import { ROUTES } from '@/shared/constants';
import { cn } from '@/shared/lib/utils';
import type { SetupStep } from '@/contexts/project';
import { CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';
import { SETUP_STEP_TEXT } from '../lib/setup';

interface SetupStepRowProps {
    step: SetupStep;
    projectId: string;
    done: boolean;
}

export const SetupStepRow = ({ step, projectId, done }: SetupStepRowProps) => {
    const text = SETUP_STEP_TEXT[step];
    const Icon = done ? CheckCircle2 : Circle;

    return (
        <li>
            <Link
                href={ROUTES.project(projectId, text.tab)}
                className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
            >
                <Icon
                    className={cn(
                        'mt-0.5 size-4 shrink-0',
                        done ? 'text-emerald-500' : 'text-muted-foreground',
                    )}
                />
                <span className="grid">
                    <span className={cn('text-sm', done && 'text-muted-foreground line-through')}>
                        {text.title}
                    </span>
                    <span className="text-[12px] text-muted-foreground">{text.hint}</span>
                </span>
            </Link>
        </li>
    );
};
