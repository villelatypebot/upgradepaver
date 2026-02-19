"use client";

import { ChatMessage } from "../chat-message";
import { Button } from "@/components/ui/button";
import { MaterialQuote, LaborQuote, formatCurrency } from "@/lib/pricing";
import { ShoppingCart, Phone, MessageCircle } from "lucide-react";

interface StepLaborQuoteProps {
    materialQuote: MaterialQuote;
    laborQuote: LaborQuote;
    ownerPhone: string;
    ownerSms: string;
    onBuyWithLabor: () => void;
    onBuyMaterialOnly: () => void;
    onTalkToOwner: () => void;
}

export function StepLaborQuote({
    materialQuote,
    laborQuote,
    ownerPhone,
    ownerSms,
    onBuyWithLabor,
    onBuyMaterialOnly,
    onTalkToOwner,
}: StepLaborQuoteProps) {
    const grandTotal = materialQuote.materialTotal + laborQuote.laborCost;

    return (
        <>
            <ChatMessage type="bot">
                <p className="font-semibold mb-3">Here&apos;s what professional installation would cost:</p>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Area</span>
                        <span>{laborQuote.areaSqft} sq ft</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Labor rate</span>
                        <span>{formatCurrency(laborQuote.laborRatePerSqft)}/sq ft</span>
                    </div>
                    <div className="flex justify-between font-medium">
                        <span className="text-muted-foreground">Labor cost</span>
                        <span>{formatCurrency(laborQuote.laborCost)}</span>
                    </div>
                    <hr className="border-border my-2" />
                    <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Estimate with Installation</p>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Material + Delivery</span>
                        <span>{formatCurrency(materialQuote.materialTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Installation (billed separately)</span>
                        <span>{formatCurrency(laborQuote.laborCost)}</span>
                    </div>
                    <hr className="border-border" />
                    <div className="flex justify-between text-base font-bold text-primary">
                        <span>Grand Total</span>
                        <span>{formatCurrency(grandTotal)}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                        * Material charged at checkout. Installation arranged separately.
                    </p>
                </div>
            </ChatMessage>

            <div className="flex flex-col items-center gap-3 mt-4 px-2">
                <Button onClick={onBuyWithLabor} size="lg" className="w-full max-w-sm font-semibold shadow-lg">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart + Request Installation
                </Button>
                <Button onClick={onBuyMaterialOnly} variant="outline" size="lg" className="w-full max-w-sm">
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
