"use client";

import { useState, useEffect } from "react";
import { ImageUpload } from "@/components/image-upload";
import { ComparisonSlider } from "@/components/comparison-slider";
import { getProducts } from "@/lib/storage";
import { PaverProduct, PaverVariant } from "@/config/pavers";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function EmbedPage() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [products, setProducts] = useState<PaverProduct[]>([]);

    // Flattened options for simple selection
    const [selectedOption, setSelectedOption] = useState<{ product: PaverProduct, variant: PaverVariant } | null>(null);

    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        getProducts().then(setProducts);
    }, []);

    // Flatten all variants for simple grid display
    const flatOptions = products.flatMap(p => p.variants.map(v => ({ product: p, variant: v })));

    const handleGenerate = async () => {
        if (!selectedImage || !selectedOption) {
            toast.error("Select image and paver");
            return;
        }

        setIsGenerating(true);
        try {
            const response = await fetch('/api/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originalImage: selectedImage,
                    paverStyle: `${selectedOption.product.name} - ${selectedOption.variant.name}`,
                    paverTexture: selectedOption.variant.textureUrl,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            if (data.generatedImage) setGeneratedImage(data.generatedImage);
        } catch (error: any) {
            toast.error("Failed to generate");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent p-4 flex flex-col">
            {!generatedImage ? (
                <div className="flex-1 space-y-4 max-w-sm mx-auto w-full bg-white/95 backdrop-blur shadow-2xl rounded-2xl p-4 border overflow-y-auto">
                    <div className="flex items-center gap-2 mb-2">
                        <img src="/logo.png" alt="Logo" className="h-6" />
                        <h2 className="font-bold text-sm">DirectPavers Visualizer</h2>
                    </div>

                    <ImageUpload selectedImage={selectedImage} onImageSelect={setSelectedImage} />

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">Select Style</label>
                        <div className="grid grid-cols-2 gap-2">
                            {flatOptions.map((option) => (
                                <div
                                    key={`${option.product.id}-${option.variant.id}`}
                                    onClick={() => setSelectedOption(option)}
                                    className={cn(
                                        "cursor-pointer rounded border p-1 transition-all text-center relative group",
                                        selectedOption?.variant.id === option.variant.id ? "ring-2 ring-primary border-transparent bg-primary/5" : "hover:bg-muted"
                                    )}
                                >
                                    <div className="relative aspect-square mb-1 rounded overflow-hidden">
                                        <img src={option.variant.exampleUrl} className="w-full h-full object-cover" />
                                        {selectedOption?.variant.id === option.variant.id && (
                                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                <Check className="w-4 h-4 text-white bg-primary rounded-full p-0.5" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] font-bold truncate">{option.product.name}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{option.variant.name}</p>
                                </div>
                            ))}
                            {flatOptions.length === 0 && <p className="text-xs text-muted-foreground col-span-2 text-center py-4">No pavers available.</p>}
                        </div>
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleGenerate}
                        disabled={!selectedImage || !selectedOption || isGenerating}
                    >
                        {isGenerating ? <Loader2 className="animate-spin w-4 h-4" /> : "Simulate Space"}
                    </Button>
                </div>
            ) : (
                <div className="flex-1 max-w-sm mx-auto w-full bg-white/95 backdrop-blur shadow-2xl rounded-2xl p-4 border flex flex-col h-[500px]">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-sm">Your Design</h3>
                        <Button variant="ghost" size="sm" onClick={() => setGeneratedImage(null)}>
                            <RefreshCcw className="w-3 h-3 mr-1" /> Back
                        </Button>
                    </div>

                    <div className="flex-1 rounded-lg overflow-hidden bg-muted relative mb-2">
                        <ComparisonSlider original={selectedImage!} generated={generatedImage} />
                    </div>

                    <Button size="sm" asChild className="w-full text-xs">
                        <a href="https://directpavers.com" target="_blank">Get a Quote</a>
                    </Button>
                </div>
            )}
        </div>
    );
}
