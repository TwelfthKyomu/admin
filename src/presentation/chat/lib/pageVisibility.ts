export const subscribePageVisibility = (onChange: () => void): (() => void) => {
    document.addEventListener('visibilitychange', onChange);

    return () => document.removeEventListener('visibilitychange', onChange);
};

export const isPageVisible = (): boolean =>
    document.visibilityState === 'visible';

export const isPageVisibleOnServer = (): boolean => true;
