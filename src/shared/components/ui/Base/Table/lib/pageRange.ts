export type PageRangeItem = number | 'left-ellipsis' | 'right-ellipsis';

export const buildPageRange = (
    current: number,
    total: number,
    siblings: number,
): PageRangeItem[] => {
    if (total <= siblings + 4) {
        return Array.from({ length: total }, (_, index) => index + 1);
    }

    const left = Math.max(2, current - siblings);
    const right = Math.min(total - 1, current + siblings);
    const showLeftDots = left > 2;
    const showRightDots = right < total - 1;

    const range: PageRangeItem[] = [1];

    if (showLeftDots) range.push('left-ellipsis');

    for (let page = left; page <= right; page += 1) range.push(page);

    if (showRightDots) range.push('right-ellipsis');

    range.push(total);

    return range;
};
