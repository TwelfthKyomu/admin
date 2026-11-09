import { insertOne } from '@/shared/api/repository';
import { organizations } from '@/contexts/organization/Organizations.table';
import { projects } from '@/contexts/project/Projects.table';
import { users } from '@/contexts/user/Users.table';
import { warehouses } from '@/contexts/warehouse/Warehouses.table';

export async function seedProject() {
    const user = await insertOne(
        users,
        { name: 'Тест', email: `${crypto.randomUUID()}@test.invalid` },
        'Не удалось создать пользователя',
    );

    const organization = await insertOne(
        organizations,
        { name: 'Тест', createdBy: user.id },
        'Не удалось создать организацию',
    );

    const project = await insertOne(
        projects,
        {
            organizationId: organization.id,
            name: 'Магазин',
            slug: crypto.randomUUID().slice(0, 8),
            key: 'SHOP',
        },
        'Не удалось создать проект',
    );

    const warehouse = await insertOne(
        warehouses,
        { projectId: project.id, name: 'Основной склад' },
        'Не удалось создать склад',
    );

    return { user, organization, project, warehouse };
}
