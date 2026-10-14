import { CreateTaskActionInputSchema } from '@/contexts/task';
import * as z from 'zod/mini';

export const TaskFromMessageFormSchema = z.pick(CreateTaskActionInputSchema, {
    projectId: true,
    title: true,
    description: true,
});

export type TaskFromMessageFormValues = z.input<
    typeof TaskFromMessageFormSchema
>;
