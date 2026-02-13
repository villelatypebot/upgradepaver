"use client";

import { ChatMessage } from "../chat-message";
import { Button } from "@/components/ui/button";
import { MaterialQuote } from "@/lib/pricing";
import { formatCurrency } from "@/lib/pricing";
import { ShoppingCart, HardHat, MapPin } from "lucide-react";
import { DeliveryZone } from "@/config/pricing";
import { cn } from "@/lib/utils";

interface StepMaterialQuoteProps {
    quote: MaterialQuote | null;
    deliveryZones: DeliveryZone[];
    selectedZone: DeliveryZone | null;
    onDeliveryZoneChange: (zone: DeliveryZone) => void;
    onBuyMaterial: () => void;
    onSeeLaborCost: () => void;
    answered: boolean;
}

export function StepMaterialQuote({
    quote,
    deliveryZones,
    selectedZone,
    onDeliveryZoneChange,
    onBuyMaterial,
    onSeeLaborCost,
    answered,
}: StepMaterialQuoteProps) {
    if (!quote) return null;

    return (
        <>
            <ChatMessage type="bot">
                <p className="font-semibold mb-1">Great choice! First, select your delivery area:</p>
            </ChatMessage>

            {/* Delivery Zone Selection */}
            <div className="mx-2 flex flex-col sm:flex-row flex-wrap gap-2">
                {deliveryZones.map(zone => (
                    <button
                        key={zone.id}
                        onClick={() => !answered && onDeliveryZoneChange(zone)}
                        className={cn(
                            "flex-1 min-w-0 sm:min-w-[140px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all",
                            selectedZone?.id === zone.id
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-border bg-white hover:border-primary/30"
                        )}
                    >
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{zone.label}</span>
                    </button>
                ))}
            </div>

            <ChatMessage type="bot">
                <p className="font-semibold mb-3">Here&apos;s your material quote:</p>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-xs md:text-sm">
                    <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Product</span>
                        <span className="font-medium text-right">{quote.product.name} - {quote.variant.name}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Area</span>
                        <span className="text-right">{quote.areaSqft} sq ft (+{quote.wastePercentage}% = {quote.areaWithWaste} sq ft)</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Per pallet</span>
                        <span>{quote.sqftPerPallet} sq ft</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Pallets needed</span>
                        <span className="font-medium">{quote.palletsNeeded}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Price per pallet</span>
                        <span>{formatCurrency(quote.pricePerPallet)}</span>
                    </div>
                    <hr className="border-border" />
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Material subtotal</span>
                        <span className="font-medium">{formatCurrency(quote.materialSubtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Delivery ({quote.deliveryZoneLabel})</span>
                        <span>{formatCurrency(quote.deliveryFee)}</span>
                    </div>
                    <hr className="border-border" />
                    <div className="flex justify-between text-sm md:text-base font-bold text-primary">
                        <span>Total</span>
                        <span>{formatCurrency(quote.materialTotal)}</span>
                    </div>
                </div>
            </ChatMessage>

            {!answered && (
                <div className="flex flex-col items-center gap-3 mt-4 px-2">
                    <Button onClick={onBuyMaterial} size="lg" className="w-full max-w-sm font-semibold shadow-lg">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Buy Material
                    </Button>
                    <Button onClick={onSeeLaborCost} variant="outline" size="lg" className="w-full max-w-sm">
                        <HardHat className="mr-2 h-4 w-4" />
                        See Installation Cost
                    </Button>
                </div>
            )}
        </>
    );
}
