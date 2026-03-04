"use client";

import { useState, useEffect } from "react";
import { ImageUpload } from "@/components/image-upload";
import { PaverSelector } from "@/components/paver-selector";
import { ComparisonSlider } from "@/components/comparison-slider";
import { ChatContainer } from "@/components/chat/chat-container";
import { ProgressBar } from "@/components/chat/progress-bar";
import { getProducts } from "@/lib/storage";
import { PaverProduct, PaverVariant, MANUFACTURERS, ManufacturerId } from "@/config/pavers";
import { Button } from "@/components/ui/button";
import { Loader2, Download, RefreshCcw, Wand2, Check, MessageCircle, Camera } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EmbedMode = "visualizer" | "quote";

const STEP_META = [
    { id: "welcome", label: "Welcome" },
    { id: "photos", label: "Photos" },
    { id: "measurements", label: "Measurements" },
    { id: "lead-capture", label: "Contact" },
    { id: "photo-product", label: "Product" },
    { id: "photo-simulation", label: "Visualization" },
    { id: "material-quote", label: "Quote" },
    { id: "labor-quote", label: "Summary" },
];

export default function EmbedPage() {
    const [mode, setMode] = useState<EmbedMode>("quote");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [products, setProducts] = useState<PaverProduct[]>([]);

    // Selection State
    const [activeManufacturer, setActiveManufacturer] = useState<ManufacturerId>("flagstone");
    const [selectedProduct, setSelectedProduct] = useState<PaverProduct | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<PaverVariant | null>(null);

    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [userName, setUserName] = useState("");
    const [userPhone, setUserPhone] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Quote mode state
    const [currentStep, setCurrentStep] = useState("welcome");
    const [completedSteps] = useState<Set<string>>(new Set());

    useEffect(() => {
        getProducts().then(setProducts);
    }, []);

    const displayedProducts = products.filter(p => p.manufacturerId === activeManufacturer);

    const handleProductSelect = (product: PaverProduct) => {
        setSelectedProduct(product);
        if (product.variants.length > 0) {
            setSelectedVariant(product.variants[0]);
        } else {
            setSelectedVariant(null);
        }
    };

    const handleGenerate = async () => {
        if (!selectedImage || !selectedProduct || !selectedVariant) {
            toast.error("Please select an image and a paver color.");
            return;
        }

        setIsGenerating(true);
        try {
            const response = await fetch('/api/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originalImage: selectedImage,
                    paverStyle: `${selectedProduct.name} - ${selectedVariant.name}`,
                    paverTexture: selectedVariant.textureUrl,
                    customPrompt: selectedProduct.prompt,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to generate simulation');

            if (data.generatedImage) {
                setGeneratedImage(data.generatedImage);
                toast.success("Simulation complete!");
            } else {
                throw new Error("No image returned from API");
            }
        } catch (error: any) {
            console.error('Error:', error);
            toast.error(error.message || "Failed to generate simulation.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleConfirmLabor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userName || !userPhone) {
            toast.error("Por favor, preencha nome e telefone.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                name: userName,
                phone: userPhone,
                manufacturer: activeManufacturer,
                productName: selectedProduct?.name,
                variantName: selectedVariant?.name,
            };

            const res = await fetch('/api/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao enviar confirmação');

            toast.success("Solicitação enviada com sucesso!");
            setIsSubmitted(true);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Falha ao enviar solicitação.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDownload = () => {
        if (generatedImage) {
            const link = document.createElement("a");
            link.href = generatedImage;
            link.download = "directpavers-simulation.jpg";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="h-[100dvh] w-full flex flex-col bg-background overflow-hidden">
            {/* Header with Mode Toggle */}
            <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur">
                <div className="px-3 py-2 flex items-center gap-2">
                    <img src="/logo.png" alt="Logo" className="h-5 w-5 object-contain" />
                    <span className="font-bold text-xs tracking-tight text-foreground">Direct Pavers</span>
                </div>
                {/* Mode Tabs */}
                <div className="px-3 pb-2 flex gap-1">
                    <button
                        onClick={() => setMode("quote")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                            mode === "quote"
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-muted text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Get a Quote
                    </button>
                    <button
                        onClick={() => setMode("visualizer")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                            mode === "visualizer"
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-muted text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Camera className="w-3.5 h-3.5" />
                        Quick Visualizer
                    </button>
                </div>
            </div>

            {/* ═══ VISUALIZER MODE ═══ */}
            {mode === "visualizer" && (
                <div className="flex-1 overflow-y-auto">
                    {!generatedImage ? (
                        <div className="p-3 md:p-4 space-y-4">
                            {/* Upload Section */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">1</span>
                                    <h2 className="text-sm font-semibold">Upload Photo</h2>
                                </div>
                                <ImageUpload
                                    selectedImage={selectedImage}
                                    onImageSelect={setSelectedImage}
                                />
                            </div>

                            {/* Product Selection */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">2</span>
                                    <h2 className="text-sm font-semibold">Select Products</h2>
                                </div>

                                {/* Manufacturer Tabs */}
                                <div className="flex bg-muted p-0.5 rounded-lg w-full overflow-x-auto">
                                    {MANUFACTURERS.map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => {
                                                setActiveManufacturer(m.id);
                                                setSelectedProduct(null);
                                                setSelectedVariant(null);
                                            }}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] md:text-xs font-medium rounded-md transition-all whitespace-nowrap",
                                                activeManufacturer === m.id ? "bg-white text-primary shadow-sm ring-1 ring-black/5" : "hover:text-foreground text-muted-foreground"
                                            )}
                                        >
                                            <img src={m.logo} alt={m.name} className="w-3.5 h-3.5 md:w-4 md:h-4 object-contain" />
                                            <span className="hidden sm:inline">{m.name}</span>
                                        </button>
                                    ))}
                                </div>

                                <PaverSelector
                                    products={displayedProducts}
                                    selectedProduct={selectedProduct}
                                    onSelect={handleProductSelect}
                                />

                                {displayedProducts.length === 0 && (
                                    <p className="text-center text-muted-foreground py-4 border-2 border-dashed rounded-xl text-xs">
                                        No products available for this manufacturer.
                                    </p>
                                )}

                                {/* Variant Selector */}
                                {selectedProduct && selectedProduct.variants.length > 0 && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 bg-card border rounded-xl p-3 shadow-sm">
                                        <h3 className="text-xs font-semibold mb-2 flex items-center gap-2">
                                            Select Color: <span className="text-primary">{selectedVariant?.name}</span>
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedProduct.variants.map(variant => (
                                                <button
                                                    key={variant.id}
                                                    onClick={() => setSelectedVariant(variant)}
                                                    className={cn(
                                                        "relative w-10 h-10 md:w-14 md:h-14 rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
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
                                        {selectedProduct.description && (
                                            <p className="mt-2 text-xs text-muted-foreground">{selectedProduct.description}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Generate Button */}
                            <Button
                                size="lg"
                                className="w-full text-sm md:text-base h-10 md:h-12 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                                onClick={handleGenerate}
                                disabled={!selectedImage || !selectedProduct || !selectedVariant || isGenerating}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Designing...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="mr-2 h-4 w-4" />
                                        Generate Visualization
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="p-3 md:p-4 space-y-3 md:space-y-4 flex flex-col h-full">
                            {/* Result Header */}
                            <div className="flex-shrink-0 flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <h2 className="text-base md:text-lg font-bold truncate">Your Design</h2>
                                    <p className="text-[10px] md:text-xs text-muted-foreground">Drag the slider to compare before & after.</p>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <Button variant="outline" size="sm" onClick={() => { setGeneratedImage(null); setIsSubmitted(false); }} className="h-7 text-xs px-2">
                                        <RefreshCcw className="mr-1 h-3 w-3" />
                                        Reset
                                    </Button>
                                    <Button size="sm" onClick={handleDownload} className="h-7 text-xs px-2">
                                        <Download className="mr-1 h-3 w-3" />
                                        Download
                                    </Button>
                                </div>
                            </div>

                            {/* Comparison Slider - fills available space */}
                            <div className="flex-1 min-h-[200px] w-full bg-muted/20 rounded-xl border p-1 shadow-inner">
                                {selectedImage && generatedImage && (
                                    <ComparisonSlider
                                        original={selectedImage}
                                        generated={generatedImage}
                                        className="h-full rounded-lg"
                                    />
                                )}
                            </div>

                            {/* Lead Capture Form */}
                            <div className="flex-shrink-0 bg-card p-3 md:p-4 rounded-xl border shadow-sm">
                                {!isSubmitted ? (
                                    <div className="space-y-3">
                                        <div>
                                            <h3 className="font-semibold text-sm">Gostou do resultado? Confirme a Mão de Obra!</h3>
                                            <p className="text-[10px] md:text-xs text-muted-foreground">Preencha seus dados para entrarmos em contato.</p>
                                        </div>
                                        <form onSubmit={handleConfirmLabor} className="flex flex-col sm:flex-row items-end gap-2 w-full">
                                            <div className="space-y-1 flex-1 w-full">
                                                <Label className="text-xs">Nome Completo</Label>
                                                <Input placeholder="Seu nome" value={userName} onChange={e => setUserName(e.target.value)} disabled={isSubmitting} className="h-8 text-xs" />
                                            </div>
                                            <div className="space-y-1 flex-1 w-full">
                                                <Label className="text-xs">Telefone / WhatsApp</Label>
                                                <Input placeholder="(11) 99999-9999" value={userPhone} onChange={e => setUserPhone(e.target.value)} disabled={isSubmitting} className="h-8 text-xs" />
                                            </div>
                                            <Button type="submit" size="sm" className="w-full sm:w-auto px-4 h-8 text-xs font-semibold" disabled={isSubmitting}>
                                                {isSubmitting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                                                Confirmar
                                            </Button>
                                        </form>
                                    </div>
                                ) : (
                                    <div className="text-center py-3 space-y-2">
                                        <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                            <Check className="w-4 h-4" />
                                        </div>
                                        <h3 className="font-semibold text-sm text-green-700">Solicitação Recebida!</h3>
                                        <p className="text-xs text-muted-foreground">Em breve entraremos em contato.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ QUOTE MODE ═══ */}
            {mode === "quote" && (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <ProgressBar
                        steps={STEP_META}
                        currentStepId={currentStep}
                        completedSteps={completedSteps}
                    />
                    <div className="flex-1 flex justify-center overflow-hidden">
                        <div className="w-full max-w-2xl flex flex-col min-h-0">
                            <ChatContainer onStepChange={(step) => setCurrentStep(step)} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
