import type { ProjectCategoryView } from '@/contexts/projectCategory';

export const subtreeIds = (
    rootId: string,
    categories: ProjectCategoryView[],
): Set<string> => {
    const ids = new Set([rootId]);
    let grew = true;

    while (grew) {
        grew = false;

        for (const category of categories) {
            if (
                category.parentId &&
                ids.has(category.parentId) &&
                !ids.has(category.id)
            ) {
                ids.add(category.id);
                grew = true;
            }
        }
    }

    return ids;
};
