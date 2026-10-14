'use server';

import { db } from '@/infrastructure/database/client';
import {
    projectMutationAction,
    projectReadAction,
} from '@/shared/api/action-client';
import { ApplicationError } from '@/shared/api/errors';
import { findInProject, insertOne, updateOne } from '@/shared/api/repository';
import { slugify } from '@/shared/format/url';
import { SLUG_PATTERN } from '@/shared/validation';
import { products } from '@/contexts/product/Products.table';
import {
    CATALOG_READ_PERMISSIONS,
    Permission,
} from '@/contexts/user/User.types';
import { and, asc, count, eq, inArray, isNull } from 'drizzle-orm';
import {
    type ProjectCategoryRecord,
    projectCategories,
} from './ProjectCategories.table';
import {
    assertCategorySlugFree,
    findCategoryDescendantIds,
    nextCategoryPosition,
} from './ProjectCategory.lib';
import {
    CategoriesActionInputSchema,
    CreateCategoryActionInputSchema,
    DeleteCategoryActionInputSchema,
    UpdateCategoryActionInputSchema,
} from './ProjectCategory.schema';

function findCategoryInProject(
    id: string,
    projectId: string,
): Promise<ProjectCategoryRecord> {
    return findInProject(
        projectCategories,
        id,
        projectId,
        'Категория не найдена',
    );
}

export const categoriesAction = projectReadAction(CATALOG_READ_PERMISSIONS)
    .inputSchema(CategoriesActionInputSchema)
    .action(async ({ parsedInput: { projectId, includeInactive } }) => {
        const baseFilter = and(
            eq(projectCategories.projectId, projectId),
            isNull(projectCategories.deletedAt),
        );

        return db
            .select()
            .from(projectCategories)
            .where(
                includeInactive
                    ? baseFilter
                    : and(baseFilter, eq(projectCategories.isActive, true)),
            )
            .orderBy(
                asc(projectCategories.parentId),
                asc(projectCategories.position),
            );
    });

export const createCategoryAction = projectMutationAction(
    Permission.MANAGE_CATALOG,
)
    .inputSchema(CreateCategoryActionInputSchema)
    .action(async ({ parsedInput }) => {
        const parentId = parsedInput.parentId ?? null;

        if (parentId !== null) {
            await findCategoryInProject(parentId, parsedInput.projectId);
        }

        const position =
            parsedInput.position ??
            (await nextCategoryPosition(parsedInput.projectId, parentId));

        const name = parsedInput.name.trim();

        if (!name) throw new ApplicationError('Укажите «Название категории»');

        const slug = (parsedInput.slug ?? slugify(name)).toLowerCase();

        if (!SLUG_PATTERN.test(slug)) {
            throw new ApplicationError(`Неверный slug: ${slug}`);
        }

        await assertCategorySlugFree({
            projectId: parsedInput.projectId,
            parentId,
            slug,
        });

        return insertOne(
            projectCategories,
            {
                projectId: parsedInput.projectId,
                parentId,
                name,
                slug,
                type: parsedInput.type,
                position,
            },
            'Не удалось создать категорию',
        );
    });

export const updateCategoryAction = projectMutationAction(
    Permission.MANAGE_CATALOG,
)
    .inputSchema(UpdateCategoryActionInputSchema)
    .action(async ({ parsedInput }) => {
        const category = await findCategoryInProject(
            parsedInput.id,
            parsedInput.projectId,
        );

        if (
            parsedInput.type !== undefined &&
            parsedInput.type !== category.type
        ) {
            const [row] = await db
                .select({ value: count() })
                .from(products)
                .where(
                    and(
                        eq(products.categoryId, category.id),
                        isNull(products.deletedAt),
                    ),
                );

            const linkedProducts = row?.value ?? 0;

            if (linkedProducts > 0) {
                throw new ApplicationError(
                    `Нельзя сменить тип категории: к ней привязано товаров — ${linkedProducts}. ` +
                        `Перенесите их в другую категорию или удалите перед сменой типа.`,
                );
            }
        }

        const parentId =
            parsedInput.parentId !== undefined
                ? parsedInput.parentId
                : category.parentId;

        const moving = parentId !== category.parentId;

        if (moving && parentId !== null) {
            if (parentId === category.id) {
                throw new ApplicationError(
                    'Категория не может быть родителем самой себе',
                );
            }

            const [, descendants] = await Promise.all([
                findCategoryInProject(parentId, category.projectId),
                findCategoryDescendantIds([category.id]),
            ]);

            if (descendants.includes(parentId)) {
                throw new ApplicationError(
                    'Нельзя перенести категорию внутрь её же подкатегории',
                );
            }
        }

        const slug = parsedInput.slug ?? category.slug;

        if (moving || slug !== category.slug) {
            await assertCategorySlugFree({
                projectId: category.projectId,
                parentId,
                slug,
                excludeId: category.id,
            });
        }

        return updateOne(
            projectCategories,
            eq(projectCategories.id, category.id),
            {
                ...(moving && {
                    parentId,
                    position: await nextCategoryPosition(
                        category.projectId,
                        parentId,
                    ),
                }),
                name: parsedInput.name?.trim(),
                slug: parsedInput.slug,
                type: parsedInput.type,
                isActive: parsedInput.isActive,
            },
            'Категория не найдена',
        );
    });

export const deleteCategoryAction = projectMutationAction(
    Permission.MANAGE_CATALOG,
)
    .inputSchema(DeleteCategoryActionInputSchema)
    .action(async ({ parsedInput: { id, projectId } }) => {
        const category = await findCategoryInProject(id, projectId);

        const affectedIds = [
            category.id,
            ...(await findCategoryDescendantIds([category.id])),
        ];

        return db.transaction(async (tx) => {
            const detached = await tx
                .update(products)
                .set({ categoryId: null })
                .where(
                    and(
                        eq(products.projectId, projectId),
                        inArray(products.categoryId, affectedIds),
                    ),
                )
                .returning({ id: products.id });

            const deleted = await tx
                .update(projectCategories)
                .set({ deletedAt: new Date(), isActive: false })
                .where(
                    and(
                        eq(projectCategories.projectId, projectId),
                        inArray(projectCategories.id, affectedIds),
                        isNull(projectCategories.deletedAt),
                    ),
                )
                .returning({ id: projectCategories.id });

            return {
                deletedCount: deleted.length,
                detachedProductsCount: detached.length,
            };
        });
    });
