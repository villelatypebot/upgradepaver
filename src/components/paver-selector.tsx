"use client";

import { PaverProduct } from "@/config/pavers";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

interface PaverSelectorProps {
    products: PaverProduct[];
    selectedProduct: PaverProduct | null;
    onSelect: (product: PaverProduct) => void;
}

export function PaverSelector({ products, selectedProduct, onSelect }: PaverSelectorProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {products.map((product) => {
                const previewVariant = product.variants[0];
                if (!previewVariant) return null;

                const isSelected = selectedProduct?.id === product.id;

                return (
                    <Card
                        key={product.id}
                        className={cn(
                            "relative cursor-pointer overflow-hidden transition-all duration-200 group border-2",
                            isSelected ? "border-primary bg-primary/5 shadow-md" : "border-transparent hover:border-primary/50 hover:scale-[1.02]"
                        )}
                        onClick={() => onSelect(product)}
                    >
                        <div className="aspect-square relative">
                            <img
                                src={previewVariant.exampleUrl}
                                alt={product.name}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                            {/* Overlay */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 flex items-center justify-center">
                                <span className="text-white font-medium text-sm border border-white/50 px-3 py-1 rounded-full backdrop-blur-sm">Select</span>
                            </div>

                            {isSelected && (
                                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1 shadow-md z-10">
                                    <Check className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                        <div className="p-3 text-center">
                            <h3 className="font-semibold text-sm md:text-base text-foreground/90">{product.name}</h3>
                            <p className="text-xs text-muted-foreground">{product.variants.length} Color{product.variants.length !== 1 ? 's' : ''}</p>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}
