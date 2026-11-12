export const CODE_LENGTH = 6;

export const acceptButtonLabel = (
    isPending: boolean,
    done: boolean,
): string => {
    if (isPending) return 'Принимаем…';

    return done ? 'Готово' : 'Принять приглашение';
};
