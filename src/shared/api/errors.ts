export class ApplicationError extends Error {
    public readonly kind: 'ApplicationError' = 'ApplicationError';

    constructor(
        message: string,
        public override readonly cause?: Error,
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

function hasKind(value: unknown): value is { kind: unknown } {
    return typeof value === 'object' && value !== null && 'kind' in value;
}

export function isApplicationError(value: unknown): value is ApplicationError {
    return hasKind(value) && value.kind === 'ApplicationError';
}

const CONSTRAINT_MESSAGES: Record<string, string> = {
    projects_organization_slug_unique: 'Проект с таким slug уже есть',
    projects_organization_key_unique: 'Проект с таким ключом уже есть',
    products_project_slug_unique: 'Товар с таким slug уже есть',
    products_project_sku_unique: 'Товар с таким SKU уже есть',
    product_variants_project_sku_unique: 'Вариант с таким SKU уже есть',
    product_variants_combo_unique: 'Такая комбинация варианта уже есть',
    project_categories_project_parent_slug_unique:
        'Категория с таким slug уже есть на этом уровне',
    project_badges_project_code_unique: 'Бейдж с таким кодом уже есть',
    coupons_project_code_unique: 'Купон с таким кодом уже есть',
    coupon_redemptions_coupon_order_unique: 'Этот купон уже применён к заказу',
    cash_shifts_one_open_per_project: 'Кассовая смена уже открыта',
    payouts_employee_project_period_unique:
        'Выплата за этот период уже зафиксирована',
    project_integrations_project_name_unique:
        'Интеграция с таким названием уже есть',
    employee_assignments_active_unique: 'Сотрудник уже работает в проекте',
    uq_project_members: 'Пользователь уже участник проекта',
    uq_org_members_user_id: 'Пользователь уже состоит в организации',
    uq_organizations_created_by: 'У вас уже есть организация',
    tasks_chat_message_unique: 'По этому сообщению задача уже создана',
};

function constraintName(error: unknown): string | null {
    let current: unknown = error;

    for (let depth = 0; depth < 3 && current; depth += 1) {
        if (typeof current !== 'object') return null;

        const { constraint, cause } = current as {
            constraint?: unknown;
            cause?: unknown;
        };

        if (typeof constraint === 'string') return constraint;

        current = cause;
    }

    return null;
}

export function constraintErrorMessage(error: unknown): string | null {
    const constraint = constraintName(error);

    return constraint ? (CONSTRAINT_MESSAGES[constraint] ?? null) : null;
}
