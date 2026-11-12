export const planActionLabel = (
    isFree: boolean,
    isCurrent: boolean,
): string => {
    if (isFree) return 'Перейти на Free';

    return isCurrent ? 'Продлить' : 'Оплатить и перейти';
};
