"use client";

import { ChatMessage } from "../chat-message";
import { Button } from "@/components/ui/button";
import { MaterialQuote, LaborQuote } from "@/lib/pricing";
import { formatCurrency } from "@/lib/pricing";
import { ShoppingCart, MapPin, Phone, MessageCircle } from "lucide-react";
import { DeliveryZone } from "@/config/pricing";
import { cn } from "@/lib/utils";
import {
    MeasurementArea,
    formatMeasurementAreaLabel,
    getAreaSqft,
    getCompletedMeasurementAreas,
} from "@/lib/measurements";

interface StepMaterialQuoteProps {
    quote: MaterialQuote | null;
    laborQuote: LaborQuote | null;
    measurementAreas: MeasurementArea[];
    deliveryZones: DeliveryZone[];
    selectedZone: DeliveryZone | null;
    onDeliveryZoneChange: (zone: DeliveryZone) => void;
    onBuyMaterial: () => void;
    onBuyWithLabor: () => void;
    onTalkToOwner: () => void;
    ownerPhone: string;
    ownerSms: string;
    answered: boolean;
}

export function StepMaterialQuote({
    quote,
    laborQuote,
    measurementAreas,
    deliveryZones,
    selectedZone,
    onDeliveryZoneChange,
    onBuyMaterial,
    onBuyWithLabor,
    onTalkToOwner,
    ownerPhone,
    ownerSms,
    answered,
}: StepMaterialQuoteProps) {
    if (!quote) return null;

    const grandTotal = laborQuote ? quote.materialTotal + laborQuote.laborCost : quote.materialTotal;
    const completedAreas = getCompletedMeasurementAreas(measurementAreas);

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
                <p className="font-semibold mb-3">Here&apos;s your complete quote:</p>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-xs md:text-sm">
                    {/* Material section */}
                    <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Material</p>
                    <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Product</span>
                        <span className="font-medium text-right">{quote.product.name} - {quote.variant.name}</span>
                    </div>
                    {completedAreas.length > 0 && (
                        <div className="space-y-1.5">
                            <div className="flex justify-between gap-2">
                                <span className="text-muted-foreground">Measured areas</span>
                                <span className="text-right">{completedAreas.length} area{completedAreas.length !== 1 ? "s" : ""}</span>
                            </div>
                            {completedAreas.map((area, index) => (
                                <div key={area.id} className="flex justify-between gap-2 text-[11px] md:text-xs text-muted-foreground">
                                    <span>{formatMeasurementAreaLabel(area, index)}</span>
                                    <span className="text-right">{area.width} ft x {area.length} ft = {getAreaSqft(area)} sq ft</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Total area</span>
                        <span className="text-right">{quote.areaSqft} sq ft (+{quote.wastePercentage}% = {quote.areaWithWaste} sq ft)</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Pallets needed</span>
                        <span className="font-medium">{quote.palletsNeeded} x {formatCurrency(quote.pricePerPallet)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Material subtotal</span>
                        <span className="font-medium">{formatCurrency(quote.materialSubtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Delivery ({quote.deliveryZoneLabel})</span>
                        <span>{formatCurrency(quote.deliveryFee)}</span>
                    </div>
                    <hr className="border-border" />
                    <div className="flex justify-between text-sm md:text-base font-bold text-primary items-center">
                        <div className="flex flex-col">
                            <span>Material Total</span>
                            <span className="text-[10px] font-normal text-muted-foreground leading-tight">+ Payment Fee</span>
                        </div>
                        <span>{formatCurrency(quote.materialTotal)}</span>
                    </div>

                    {/* Labor section */}
                    {laborQuote && (
                        <>
                            <hr className="border-border my-2" />
                            <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Installation Estimate</p>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Labor</span>
                                <span className="font-medium">{formatCurrency(laborQuote.laborCost)}</span>
                            </div>
                            <hr className="border-border" />
                            <div className="flex justify-between text-sm md:text-base font-bold text-primary items-center">
                                <div className="flex flex-col">
                                    <span>Grand Total</span>
                                    <span className="text-[10px] font-normal text-muted-foreground leading-tight">+ Payment Fee</span>
                                </div>
                                <span>{formatCurrency(grandTotal)}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">
                                * Material charged at checkout. Installation arranged separately.
                            </p>
                        </>
                    )}
                </div>
            </ChatMessage>

            {!answered && (
                <div className="flex flex-col items-center gap-3 mt-4 px-2">
                    <Button onClick={onBuyWithLabor} size="lg" className="w-full max-w-sm font-semibold shadow-lg">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Add to Cart + Request Installation
                    </Button>
                    <Button onClick={onBuyMaterial} variant="outline" size="lg" className="w-full max-w-sm">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Add to Cart (Material Only)
                    </Button>
                    <p className="text-xs text-center text-muted-foreground max-w-sm">
                        Installation is not charged at checkout. Our team will contact you to schedule and confirm labor costs.
                    </p>
                    <Button onClick={onTalkToOwner} variant="ghost" size="lg" className="w-full max-w-sm text-muted-foreground">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Talk to Owner First
                    </Button>
                </div>
            )}

            <ChatMessage type="bot">
                <p className="text-muted-foreground text-xs">
                    Have questions? You can always reach us:
                </p>
                <div className="flex gap-3 mt-2">
                    <a
                        href={`tel:${ownerPhone}`}
                        className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                        <Phone className="w-3 h-3" /> Call
                    </a>
                    <a
                        href={`sms:${ownerSms}`}
                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                    >
                        <MessageCircle className="w-3 h-3" /> SMS
                    </a>
                </div>
            </ChatMessage>
        </>
    );
}
