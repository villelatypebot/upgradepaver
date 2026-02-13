"use client";

import { ChatMessage } from "../chat-message";
import { ComparisonSlider } from "@/components/comparison-slider";
import { Button } from "@/components/ui/button";
import { Download, DollarSign, RefreshCcw, Loader2 } from "lucide-react";
import { PaverProduct, PaverVariant } from "@/config/pavers";

interface StepSimulationProps {
    originalImage: string;
    generatedImage: string | null;
    isGenerating: boolean;
    product: PaverProduct;
    variant: PaverVariant;
    onShowQuote: () => void;
    onTryAnother: () => void;
    onDownload: () => void;
    answered: boolean;
    isLastPhoto?: boolean;
}

export function StepSimulation({
    originalImage,
    generatedImage,
    isGenerating,
    product,
    variant,
    onShowQuote,
    onTryAnother,
    onDownload,
    answered,
    isLastPhoto = true,
}: StepSimulationProps) {
    if (isGenerating) {
        return (
            <ChatMessage type="bot">
                <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <div>
                        <p className="font-medium">Generating your visualization...</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Applying {product.name} - {variant.name} to your space. This may take a moment.
                        </p>
                    </div>
                </div>
            </ChatMessage>
        );
    }

    if (!generatedImage) return null;

    return (
        <>
            <ChatMessage type="bot">
                <p className="font-semibold mb-2">
                    Here&apos;s how your space would look with {product.name} in {variant.name}!
                </p>
                <p className="text-muted-foreground text-xs">Drag the slider to compare before & after.</p>
            </ChatMessage>

            <div className="mx-2 h-[300px] md:h-[400px] rounded-xl overflow-hidden border shadow-lg">
                <ComparisonSlider
                    original={originalImage}
                    generated={generatedImage}
                    className="h-full"
                />
            </div>

            {!answered && (
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                    <Button onClick={onShowQuote} size="lg" className="font-semibold shadow-lg">
                        {isLastPhoto ? (
                            <>
                                <DollarSign className="mr-2 h-4 w-4" />
                                Show Me the Price
                            </>
                        ) : (
                            "Approve & Next Photo"
                        )}
                    </Button>
                    <Button variant="outline" onClick={onTryAnother}>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Try Another Style
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onDownload}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                    </Button>
                </div>
            )}

            {answered && (
                <ChatMessage type="user">Show me the price!</ChatMessage>
            )}
        </>
    );
}
