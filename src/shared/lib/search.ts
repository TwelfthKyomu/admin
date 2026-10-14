export function matchesSearch(
    search: string,
    ...values: (string | number | undefined)[]
): boolean {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return values.some((value) =>
        String(value ?? '')
            .toLowerCase()
            .includes(query),
    );
}
