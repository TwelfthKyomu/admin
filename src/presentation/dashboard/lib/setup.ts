import { SetupStep } from '@/contexts/project';

interface SetupStepText {
    title: string;
    hint: string;
    tab: string;
}

export const SETUP_STEP_TEXT: Record<SetupStep, SetupStepText> = {
    [SetupStep.PRODUCTS]: {
        title: 'Добавьте товары',
        hint: 'По одному или списком из CSV — кнопка «Импорт».',
        tab: 'products',
    },
    [SetupStep.STOCK]: {
        title: 'Укажите остатки',
        hint: 'Приёмка на склад — и сайт покажет наличие.',
        tab: 'warehouse',
    },
    [SetupStep.TEAM]: {
        title: 'Пригласите команду',
        hint: 'Продавцы, курьеры, бухгалтер — у каждого свои права.',
        tab: 'members',
    },
    [SetupStep.PAYMENTS]: {
        title: 'Подключите оплату',
        hint: 'Платёжный провайдер для оплаты онлайн.',
        tab: 'integrations',
    },
    [SetupStep.SITE]: {
        title: 'Подключите сайт',
        hint: 'Ключ API витрины — каталог и заказы с вашего сайта.',
        tab: 'integrations',
    },
    [SetupStep.FIRST_SALE]: {
        title: 'Проведите первую продажу',
        hint: 'Кнопка «Продажа» на вкладке заказов.',
        tab: 'orders',
    },
};

const HIDDEN_KEY = 'setup-hidden';
const listeners = new Set<() => void>();

export function subscribeSetupHidden(listener: () => void): () => void {
    listeners.add(listener);

    return () => listeners.delete(listener);
}

export function readHiddenSetups(): string {
    try {
        return window.localStorage.getItem(HIDDEN_KEY) ?? '';
    } catch {
        return '';
    }
}

export function hideSetup(projectId: string): void {
    const ids = new Set(readHiddenSetups().split(',').filter(Boolean)).add(
        projectId,
    );

    try {
        window.localStorage.setItem(HIDDEN_KEY, [...ids].join(','));
    } catch {
        return;
    }

    for (const listener of listeners) listener();
}
