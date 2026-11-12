export const startProgress = (node: HTMLElement, duration: number): Animation =>
    node.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], {
        duration,
        easing: 'linear',
        fill: 'forwards',
    });
