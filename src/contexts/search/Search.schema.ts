import { LABEL_MAX } from '@/shared/constants/default';
import * as z from 'zod/mini';

export const SEARCH_MIN_LENGTH = 2;

export const SEARCH_RESULTS_LIMIT = 5;

export const SearchActionInputSchema = z.object({
    query: z
        .string()
        .check(
            z.trim(),
            z.minLength(SEARCH_MIN_LENGTH),
            z.maxLength(LABEL_MAX),
        ),
});
