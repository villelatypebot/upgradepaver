export type ManufacturerId = 'flagstone' | 'tremron' | 'tricircle';

export interface PaverVariant {
    id: string;
    name: string;
    textureUrl: string;
    exampleUrl: string;
    shopifyUrl?: string;
    pricePerPallet?: number;
}

export interface PaverProduct {
    id: string;
    name: string;
    description?: string;
    manufacturerId: ManufacturerId;
    prompt?: string;
    variants: PaverVariant[];
    pricePerPallet?: number;
    sqftPerPallet?: number;
    weightPerPallet?: number;
}

export const MANUFACTURERS: { id: ManufacturerId; name: string; logo: string }[] = [
    { id: 'flagstone', name: 'Flagstone Pavers', logo: '/logos/flagstone.png' },
    { id: 'tremron', name: 'Tremron', logo: '/logos/tremron.png' },
    { id: 'tricircle', name: 'TriCircle', logo: '/logos/tricircle.png' },
];

export const INITIAL_PRODUCTS: PaverProduct[] = [
    {
        id: "monaco",
        name: "Monaco",
        description: "Elegant and timeless stone look.",
        manufacturerId: 'tremron',
        variants: [
            {
                id: 'monaco-glacier',
                name: 'Glacier',
                textureUrl: "https://www.tremron.com/images/colors/roma/Monaco-Glacier.jpg",
                exampleUrl: "https://www.tremron.com/images/product_slider/monaco_1.jpg",
            }
        ]
    },
    // We can migrate others or start fresh. Let's keep one example.
];

// Legacy type for backward compatibility during migration if needed
export interface PaverOption {
    id: string;
    name: string;
    textureUrl: string;
    exampleUrl: string;
    description?: string;
}

// Deprecated: used for migration mapping
export const PAVER_OPTIONS: PaverOption[] = [];
