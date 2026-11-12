export const stockLabel = (stock: number | undefined): string | undefined => {
    if (stock === undefined) return undefined;

    return stock > 0 ? `остаток ${stock}` : 'нет в наличии';
};
