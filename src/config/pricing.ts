export interface DeliveryZone {
    id: string;
    name: string;
    label: string;
    fee: number;
    radius_description?: string;
    sort_order: number;
    active: boolean;
}

export interface PricingConfig {
    laborRatePerSqft: number;
    wastePercentage: number;
    ownerPhone: string;
    ownerWhatsapp: string;
    requireLeadCapture: boolean;
}

export const DEFAULT_PRICING: PricingConfig = {
    laborRatePerSqft: 8.00,
    wastePercentage: 10,
    ownerPhone: '+18138191450',
    ownerWhatsapp: '+18138191450',
    requireLeadCapture: true,
};

// Default delivery zones (fallback when DB is empty)
export const DEFAULT_DELIVERY_ZONES: DeliveryZone[] = [
    { id: 'tampa', name: 'tampa', label: 'Tampa (+ 25 miles)', fee: 300, sort_order: 1, active: true },
    { id: 'orlando', name: 'orlando', label: 'Orlando (+ 25 miles)', fee: 400, sort_order: 2, active: true },
];

// Default product pricing data from directpavers.com
// These serve as fallback when products don't have pricing set
export const DEFAULT_PRODUCT_PRICING: Record<string, { pricePerPallet: number; sqftPerPallet: number }> = {
    // Flagstone
    'eco-citylock-4x8-60mm': { pricePerPallet: 280, sqftPerPallet: 100 },
    'eco-citylock-hexaplank': { pricePerPallet: 270, sqftPerPallet: 100 },
    'eco-citylock-demi': { pricePerPallet: 225, sqftPerPallet: 100 },
    'eco-citylock-5x10-80mm': { pricePerPallet: 255, sqftPerPallet: 100 },
    'victory': { pricePerPallet: 265, sqftPerPallet: 100 },
    'union': { pricePerPallet: 285, sqftPerPallet: 100 },
    'heritage': { pricePerPallet: 270, sqftPerPallet: 100 },
    'freedom': { pricePerPallet: 295, sqftPerPallet: 100 },
    // Tremron
    'monaco': { pricePerPallet: 285, sqftPerPallet: 107 },
    'tuscany': { pricePerPallet: 400, sqftPerPallet: 72 },
    'ultra-combo': { pricePerPallet: 320, sqftPerPallet: 107 },
    'templehurst': { pricePerPallet: 320, sqftPerPallet: 103 },
    'templehurst-smooth': { pricePerPallet: 320, sqftPerPallet: 103 },
};
