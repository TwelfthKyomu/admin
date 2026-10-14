import { CODE_MAX } from '@/shared/constants/default';
import { normalizeCode } from '@/shared/validation';

export const PROJECT_BADGE_DEFAULT_COLOR = '#737373';

export function normalizeBadgeCode(value: string): string | null {
    return normalizeCode(value, CODE_MAX);
}
