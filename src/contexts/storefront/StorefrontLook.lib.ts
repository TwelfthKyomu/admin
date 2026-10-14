import 'server-only';

import { loadProjectLooks } from '@/contexts/look/Look.lib';
import { ProductType } from '@/contexts/product/Product.types';
import type { StorefrontAccess } from './Storefront.types';
import { loadStorefrontCatalog, publicImageUrl } from './StorefrontCatalog.lib';

export async function loadStorefrontLooks(access: StorefrontAccess) {
    const looks = await loadProjectLooks(access.projectId, true);

    const ids = [
        ...new Set(
            looks.flatMap((look) => look.items.map((item) => item.productId)),
        ),
    ];

    const catalog = ids.length
        ? await loadStorefrontCatalog(access, {
              ids,
              type: ProductType.PHYSICAL,
          })
        : undefined;

    const productById = new Map(
        (catalog?.products ?? []).map((product) => [product.id, product]),
    );

    return {
        looks: looks.map((look) => ({
            id: look.id,
            title: look.title,
            description: look.description ?? undefined,
            image: publicImageUrl(access.projectId, look.image),
            items: look.items.flatMap((item) => {
                const product = productById.get(item.productId);

                return product ? [{ x: item.x, y: item.y, product }] : [];
            }),
        })),
    };
}
