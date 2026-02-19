/**
 * Shopify integration config.
 * Maps product names to their Shopify variant IDs for cart URL construction.
 */

export const SHOPIFY_STORE_URL = 'https://directpavers.com';

/**
 * Maps product name (lowercase) → Shopify variant ID.
 * These IDs come from the ?variant= param in each product URL.
 */
const SHOPIFY_VARIANT_IDS: Record<string, string> = {
    // Flagstone
    'eco-citylock-4x8-60mm': '47468302237950',
    'eco-citylock-hexaplank': '47468342444286',
    'eco-citylock-demi': '47468330025214',
    'eco-citylock-5x10-80mm': '47468313805054',
    'victory': '47467656741118',
    'union': '47467045683454',
    'heritage': '47466994893054',
    'freedom': '47462381093118',
    // Tremron - Pavers
    'monaco': '47430354960638',
    'tuscany': '47453584687358',
    'ultra-combo': '47433346056446',
    'templehurst': '47433400746238',
    'templehurst-smooth': '47433442001150',
    // Tremron - Retaining Walls
    'lenzablock': '47544298275070',
    'lenzacap': '47453613949182',
    'stonegate': '47453612212478',
    // Tremron - Sealers
    'satin-look-sealer': '47462350848254',
    'natural-stone-sealer': '47462349635838',
    'natural-look-sealer': '47462348882174',
    'low-gloss-sealer': '47462343016702',
    // Tremron - Accessories
    'fire-pits': '47461975326974',
};

/**
 * Look up the Shopify variant ID for a product by name.
 * Uses case-insensitive matching.
 */
export function getShopifyVariantId(productName: string): string | null {
    const key = productName.toLowerCase().trim();
    return SHOPIFY_VARIANT_IDS[key] || null;
}

/**
 * Build a Shopify cart permalink URL.
 * Format: https://directpavers.com/cart/{variantId}:{quantity}?note={note}
 * Returns null if variantId is empty or quantity < 1.
 */
export function buildCartUrl(
    variantId: string,
    quantity: number,
    note?: string
): string | null {
    if (!variantId || quantity < 1) return null;
    let url = `${SHOPIFY_STORE_URL}/cart/${variantId}:${quantity}`;
    if (note) {
        url += `?note=${encodeURIComponent(note)}`;
    }
    return url;
}
