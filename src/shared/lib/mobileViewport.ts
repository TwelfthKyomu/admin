const MOBILE_QUERY = '(max-width: 767px)';

export const subscribeMobileViewport = (onChange: () => void): (() => void) => {
    const query = window.matchMedia(MOBILE_QUERY);

    query.addEventListener('change', onChange);

    return () => query.removeEventListener('change', onChange);
};

export const isMobileViewport = (): boolean =>
    window.matchMedia(MOBILE_QUERY).matches;

export const isMobileViewportOnServer = (): boolean => false;
