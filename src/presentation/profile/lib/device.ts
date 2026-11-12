import Bowser from 'bowser';

export const deviceLabel = (userAgent?: string): string => {
    const { browser, os } = Bowser.parse(userAgent || 'unknown');

    return (
        [browser.name, os.name].filter(Boolean).join(' · ') ||
        'Неизвестное устройство'
    );
};
