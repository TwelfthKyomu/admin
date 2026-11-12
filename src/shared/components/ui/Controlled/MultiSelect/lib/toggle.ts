export const toggleValue = (selected: string[], value: string): string[] => {
    return selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value];
};
