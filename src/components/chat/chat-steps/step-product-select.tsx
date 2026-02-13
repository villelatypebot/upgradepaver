"use client";

import { ChatMessage } from "../chat-message";
import { Button } from "@/components/ui/button";
import { PaverProduct, PaverVariant, MANUFACTURERS, ManufacturerId } from "@/config/pavers";
import { cn } from "@/lib/utils";
import { Check, Wand2 } from "lucide-react";

interface StepProductSelectProps {
    products: PaverProduct[];
    activeManufacturer: ManufacturerId;
    selectedProduct: PaverProduct | null;
    selectedVariant: PaverVariant | null;
    onManufacturerChange: (id: ManufacturerId) => void;
    onProductSelect: (product: PaverProduct) => void;
    onVariantSelect: (variant: PaverVariant) => void;
    onGenerate: () => void;
    answered: boolean;
}

export function StepProductSelect({
    products,
    activeManufacturer,
    selectedProduct,
    selectedVariant,
    onManufacturerChange,
    onProductSelect,
    onVariantSelect,
    onGenerate,
    answered,
}: StepProductSelectProps) {
    const displayedProducts = products.filter(p => p.manufacturerId === activeManufacturer);

    if (answered && selectedProduct && selectedVariant) {
        return (
            <>
                <ChatMessage type="bot">Choose your paver style and color.</ChatMessage>
                <ChatMessage type="user">
                    <div className="flex items-center gap-3">
                        <img src={selectedVariant.textureUrl} alt={selectedVariant.name} className="w-12 h-12 rounded-lg object-cover border" />
                        <div>
                            <p className="font-medium">{selectedProduct.name}</p>
                            <p className="text-xs opacity-80">{selectedVariant.name}</p>
                        </div>
                    </div>
                </ChatMessage>
            </>
        );
    }

    return (
        <>
            <ChatMessage type="bot">
                Choose your paver style and color. Then we&apos;ll generate a visualization of your space.
            </ChatMessage>
            <div className="mt-3 space-y-4 px-2">
                {/* Manufacturer Tabs */}
                <div className="flex bg-muted p-1 rounded-lg w-full overflow-x-auto">
                    {MANUFACTURERS.map(m => (
                        <button
                            key={m.id}
                            onClick={() => onManufacturerChange(m.id)}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap",
                                activeManufacturer === m.id
                                    ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                                    : "hover:text-foreground text-muted-foreground"
                            )}
                        >
                            <img src={m.logo} alt={m.name} className="w-5 h-5 object-contain" />
                            <span className="hidden sm:inline">{m.name}</span>
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {displayedProducts.map((product) => {
                        const previewVariant = product.variants[0];
                        if (!previewVariant) return null;
                        const isSelected = selectedProduct?.id === product.id;

                        return (
                            <div
                                key={product.id}
                                className={cn(
                                    "relative cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-200 bg-white shadow-sm",
                                    isSelected ? "border-primary bg-primary/5 shadow-md" : "border-transparent hover:border-primary/50"
                                )}
                                onClick={() => onProductSelect(product)}
                            >
                                <div className="aspect-square relative">
                                    <img src={previewVariant.exampleUrl} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1 shadow-md">
                                            <Check className="w-3 h-3" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-2 text-center">
                                    <h3 className="font-semibold text-xs">{product.name}</h3>
                                    <p className="text-[10px] text-muted-foreground">{product.variants.length} color{product.variants.length !== 1 ? "s" : ""}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {displayedProducts.length === 0 && (
                    <p className="text-center text-muted-foreground py-6 border-2 border-dashed rounded-xl text-sm">
                        No products available for this manufacturer.
                    </p>
                )}

                {/* Variant Selector */}
                {selectedProduct && selectedProduct.variants.length > 0 && (
                    <div className="bg-white border rounded-xl p-3 shadow-sm">
                        <h3 className="text-xs font-semibold mb-2 flex items-center gap-2">
                            Select Color: <span className="text-primary">{selectedVariant?.name}</span>
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {selectedProduct.variants.map(variant => (
                                <button
                                    key={variant.id}
                                    onClick={() => onVariantSelect(variant)}
                                    className={cn(
                                        "relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
                                        selectedVariant?.id === variant.id ? "border-primary ring-2 ring-primary/20 scale-105" : "border-transparent opacity-80 hover:opacity-100"
                                    )}
                                    title={variant.name}
                                >
                                    <img src={variant.textureUrl} alt={variant.name} className="w-full h-full object-cover" />
                                    {selectedVariant?.id === variant.id && (
                                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                            <div className="bg-primary text-primary-foreground rounded-full p-0.5">
                                                <Check className="w-2.5 h-2.5" />
                                            </div>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Generate Button */}
                {selectedProduct && selectedVariant && (
                    <div className="flex justify-center">
                        <Button onClick={onGenerate} size="lg" className="px-8 font-semibold shadow-lg">
                            <Wand2 className="mr-2 h-4 w-4" />
                            Generate Visualization
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}
