const SEGMENT_LABEL: Record<string, string> = {
    audit: 'Журнал',
    badges: 'Бейджи',
    billing: 'Тариф',
    cash: 'Касса',
    catalog: 'Каталог',
    categories: 'Категории',
    chat: 'Чат',
    clients: 'Клиенты',
    coupons: 'Купоны',
    deliveries: 'Доставки',
    integrations: 'Интеграции',
    looks: 'Образы',
    members: 'Сотрудники',
    orders: 'Заказы',
    other: 'Прочее',
    payroll: 'Расчёты',
    products: 'Продукты',
    profile: 'Профиль',
    projects: 'Проекты',
    replacements: 'Замены',
    revenue: 'Выручка',
    schedule: 'Расписание',
    selling: 'Продажи',
    tasks: 'Задачи',
    team: 'Команда',
    users: 'Пользователи',
    warehouse: 'Склады',
};

export const HOME_LABEL = 'Главная';

export const ORDER_LABEL = 'Заказ';

export function segmentLabel(segment: string): string {
    return SEGMENT_LABEL[segment] ?? segment;
}
