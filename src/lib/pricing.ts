import { PaverProduct, PaverVariant } from '@/config/pavers';
import { PricingConfig, DEFAULT_PRICING } from '@/config/pricing';

export interface MaterialQuote {
    product: PaverProduct;
    variant: PaverVariant;
    areaSqft: number;
    areaWithWaste: number;
    wastePercentage: number;
    palletsNeeded: number;
    pricePerPallet: number;
    sqftPerPallet: number;
    materialSubtotal: number;
    deliveryFee: number;
    deliveryZoneLabel: string;
    materialTotal: number;
}

export interface LaborQuote {
    areaSqft: number;
    laborRatePerSqft: number;
    laborCost: number;
}

export interface FullQuote {
    material: MaterialQuote;
    labor: LaborQuote | null;
    grandTotal: number;
}

export function calculateMaterialQuote(
    areaSqft: number,
    product: PaverProduct,
    variant: PaverVariant,
    deliveryFee: number,
    deliveryZoneLabel: string,
    pricing: PricingConfig = DEFAULT_PRICING
): MaterialQuote {
    const wastePercentage = pricing.wastePercentage;
    const areaWithWaste = Math.ceil(areaSqft * (1 + wastePercentage / 100));

    const sqftPerPallet = product.sqftPerPallet || 100;
    const pricePerPallet = variant.pricePerPallet || product.pricePerPallet || 285;

    const palletsNeeded = Math.ceil(areaWithWaste / sqftPerPallet);
    const materialSubtotal = palletsNeeded * pricePerPallet;

    return {
        product,
        variant,
        areaSqft,
        areaWithWaste,
        wastePercentage,
        palletsNeeded,
        pricePerPallet,
        sqftPerPallet,
        materialSubtotal,
        deliveryFee,
        deliveryZoneLabel,
        materialTotal: materialSubtotal + deliveryFee,
    };
}

export function calculateLaborQuote(
    areaSqft: number,
    pricing: PricingConfig = DEFAULT_PRICING
): LaborQuote {
    const laborCost = areaSqft * pricing.laborRatePerSqft;
    return {
        areaSqft,
        laborRatePerSqft: pricing.laborRatePerSqft,
        laborCost,
    };
}

export function calculateFullQuote(
    material: MaterialQuote,
    labor: LaborQuote | null
): FullQuote {
    const grandTotal = material.materialTotal + (labor?.laborCost || 0);
    return { material, labor, grandTotal };
}

export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
}
