import * as z from 'zod/mini';

export const idSchema = z.string().check(z.minLength(1));

export const projectScopeSchema = z.object({ projectId: idSchema });

export const entityInProjectSchema = z.object({
    id: idSchema,
    projectId: idSchema,
});

export const optionalText = <T extends z.ZodMiniType<string, string>>(
    schema: T,
) =>
    z.optional(
        z.pipe(
            z.union([z.literal(''), schema]),
            z.transform((value) => (value === '' ? undefined : value)),
        ),
    );

export const positiveIntSchema = z.int().check(z.positive());

export const nonNegativeIntSchema = z.int().check(z.nonnegative());

export const moneyAmountSchema = z.int().check(z.nonnegative());
