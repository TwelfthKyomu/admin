import { toast } from '@/shared/lib/toast';

export const showSessionError = (error: Error) => toast.error(error.message);
