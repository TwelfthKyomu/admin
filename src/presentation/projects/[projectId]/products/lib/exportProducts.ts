import { csvAmount, downloadCsv } from '@/shared/lib/csv';
import { PRODUCT_IMPORT_HEADER, type ProductView } from '@/contexts/product';

export const exportProducts = (
    products: ProductView[],
    categoryNames: Map<string, string>,
): void => {
    downloadCsv(
        `products-${new Date().toISOString().slice(0, 10)}.csv`,
        PRODUCT_IMPORT_HEADER,
        products.map((product) => [
            product.name,
            product.sku,
            csvAmount(product.price),
            product.costAmount === undefined
                ? ''
                : csvAmount(product.costAmount),
            product.barcode,
            product.categoryId ? categoryNames.get(product.categoryId) : '',
            product.stock,
            product.description,
        ]),
    );
};
