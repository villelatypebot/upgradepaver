"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { TypingIndicator, ChatMessage } from "./chat-message";
import { StepWelcome } from "./chat-steps/step-welcome";
import { StepPhotos } from "./chat-steps/step-photos";
import { StepMeasurements } from "./chat-steps/step-measurements";
import { StepLeadCapture } from "./chat-steps/step-lead-capture";
import { StepProductSelect } from "./chat-steps/step-product-select";
import { StepSimulation } from "./chat-steps/step-simulation";
import { StepMaterialQuote } from "./chat-steps/step-material-quote";
import { StepLaborQuote } from "./chat-steps/step-labor-quote";
import { getProducts } from "@/lib/storage";
import { PaverProduct, PaverVariant, ManufacturerId } from "@/config/pavers";
import { PricingConfig, DEFAULT_PRICING, DeliveryZone } from "@/config/pricing";
import { calculateMaterialQuote, calculateLaborQuote, MaterialQuote, LaborQuote } from "@/lib/pricing";
import { trackEvent, getSessionId, EVENTS } from "@/lib/analytics";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

type Step = "welcome" | "photos" | "measurements" | "lead-capture" | "photo-product" | "photo-simulation" | "material-quote" | "labor-quote";

interface PhotoEntry {
    photo: string;
    product: PaverProduct | null;
    variant: PaverVariant | null;
    generatedImage: string | null;
    done: boolean;
}

interface ChatContainerProps {
    onStepChange?: (step: Step) => void;
}

export function ChatContainer({ onStepChange }: ChatContainerProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isTyping, setIsTyping] = useState(false);

    // Flow state
    const [currentStep, setCurrentStep] = useState<Step>("welcome");
    const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());

    // Data state
    const [products, setProducts] = useState<PaverProduct[]>([]);
    const [pricingConfig, setPricingConfig] = useState<PricingConfig>(DEFAULT_PRICING);
    const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
    const [photos, setPhotos] = useState<string[]>([]);
    const [width, setWidth] = useState(0);
    const [length, setLength] = useState(0);

    // Lead capture
    const [leadData, setLeadData] = useState<{ name: string; email: string; phone?: string } | null>(null);

    // Per-photo state
    const [photoEntries, setPhotoEntries] = useState<PhotoEntry[]>([]);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    // Current photo's selection state
    const [activeManufacturer, setActiveManufacturer] = useState<ManufacturerId>("flagstone");
    const [selectedProduct, setSelectedProduct] = useState<PaverProduct | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<PaverVariant | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Quote state
    const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
    const [materialQuote, setMaterialQuote] = useState<MaterialQuote | null>(null);
    const [laborQuote, setLaborQuote] = useState<LaborQuote | null>(null);

    useEffect(() => {
        getProducts().then(setProducts);
        fetch('/api/pricing').then(r => r.json()).then(data => {
            if (data && !data.error) setPricingConfig(data);
        }).catch(() => {});
        fetch('/api/delivery-zones').then(r => r.json()).then(data => {
            if (Array.isArray(data) && data.length > 0) {
                setDeliveryZones(data);
                setSelectedZone(data[0]);
            }
        }).catch(() => {});
        // Analytics
        trackEvent(EVENTS.SESSION_STARTED);
        trackEvent(EVENTS.PAGE_VIEW, { page: 'quote' });
    }, []);

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            scrollRef.current?.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth",
            });
        }, 100);
    }, []);

    const changeStep = useCallback((step: Step) => {
        setCurrentStep(step);
        onStepChange?.(step);
    }, [onStepChange]);

    const advanceStep = useCallback((nextStep: Step) => {
        trackEvent(EVENTS.STEP_COMPLETED, { step: currentStep }, currentStep);
        setCompletedSteps(prev => new Set([...prev, currentStep]));
        setIsTyping(true);
        scrollToBottom();
        setTimeout(() => {
            setIsTyping(false);
            changeStep(nextStep);
            trackEvent(EVENTS.STEP_ENTERED, { step: nextStep }, nextStep);
            scrollToBottom();
        }, 800);
    }, [currentStep, scrollToBottom, changeStep]);

    // When photos are confirmed, build photoEntries
    const handlePhotosConfirmed = () => {
        const entries: PhotoEntry[] = photos.map(p => ({
            photo: p,
            product: null,
            variant: null,
            generatedImage: null,
            done: false,
        }));
        setPhotoEntries(entries);
        setCurrentPhotoIndex(0);
        resetPhotoSelection();
        trackEvent(EVENTS.PHOTO_UPLOADED, { count: photos.length });
        // If lead capture is enabled, go to lead capture; otherwise skip to product
        if (pricingConfig.requireLeadCapture) {
            advanceStep("lead-capture");
        } else {
            advanceStep("photo-product");
        }
    };

    const resetPhotoSelection = () => {
        setActiveManufacturer("flagstone");
        setSelectedProduct(null);
        setSelectedVariant(null);
        setGeneratedImage(null);
    };

    // Lead capture handlers
    const handleLeadSubmit = async (lead: { name: string; email: string; phone?: string }) => {
        setLeadData(lead);
        trackEvent(EVENTS.LEAD_CAPTURED, { source: 'quote' });
        try {
            await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...lead, session_id: getSessionId(), source: 'quote' }),
            });
        } catch {
            // silent — don't block flow
        }
        advanceStep("photo-product");
    };

    const handleLeadSkip = () => {
        advanceStep("photo-product");
    };

    // Handlers
    const handleProductSelect = (product: PaverProduct) => {
        setSelectedProduct(product);
        trackEvent(EVENTS.PRODUCT_SELECTED, { product: product.name });
        if (product.variants.length > 0) {
            setSelectedVariant(product.variants[0]);
        } else {
            setSelectedVariant(null);
        }
    };

    const handleGenerate = async () => {
        const currentPhoto = photoEntries[currentPhotoIndex];
        if (!currentPhoto || !selectedProduct || !selectedVariant) {
            toast.error("Please select a paver color.");
            return;
        }

        changeStep("photo-simulation");
        setIsGenerating(true);
        scrollToBottom();

        try {
            const response = await fetch('/api/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originalImage: currentPhoto.photo,
                    paverStyle: `${selectedProduct.name} - ${selectedVariant.name}`,
                    paverTexture: selectedVariant.textureUrl,
                    customPrompt: selectedProduct.prompt,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to generate simulation');

            if (data.generatedImage) {
                setGeneratedImage(data.generatedImage);
                trackEvent(EVENTS.SIMULATION_GENERATED, { product: selectedProduct.name });
                toast.success("Visualization complete!");
                scrollToBottom();
            } else {
                throw new Error("No image returned from API");
            }
        } catch (error: any) {
            console.error('Error:', error);
            trackEvent(EVENTS.SIMULATION_FAILED, { error: error.message });
            toast.error(error.message || "Failed to generate simulation.");
            changeStep("photo-product");
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePhotoApproved = () => {
        const updated = [...photoEntries];
        updated[currentPhotoIndex] = {
            ...updated[currentPhotoIndex],
            product: selectedProduct,
            variant: selectedVariant,
            generatedImage: generatedImage,
            done: true,
        };
        setPhotoEntries(updated);

        const nextIndex = currentPhotoIndex + 1;
        if (nextIndex < photoEntries.length) {
            setCurrentPhotoIndex(nextIndex);
            resetPhotoSelection();
            setIsTyping(true);
            scrollToBottom();
            setTimeout(() => {
                setIsTyping(false);
                changeStep("photo-product");
                scrollToBottom();
            }, 800);
        } else {
            if (selectedProduct && selectedVariant && selectedZone) {
                const sqft = width * length;
                const quote = calculateMaterialQuote(sqft, selectedProduct, selectedVariant, selectedZone.fee, selectedZone.label, pricingConfig);
                setMaterialQuote(quote);
                trackEvent(EVENTS.QUOTE_VIEWED, { type: 'material', total: quote.materialTotal });
            }
            advanceStep("material-quote");
        }
    };

    const handleTryAnother = () => {
        setGeneratedImage(null);
        resetPhotoSelection();
        changeStep("photo-product");
        scrollToBottom();
    };

    const handleShowQuote = () => {
        handlePhotoApproved();
    };

    const handleDeliveryZoneChange = (zone: DeliveryZone) => {
        setSelectedZone(zone);
        const lastDone = [...photoEntries].reverse().find(e => e.done);
        if (lastDone?.product && lastDone?.variant) {
            const sqft = width * length;
            const quote = calculateMaterialQuote(sqft, lastDone.product, lastDone.variant, zone.fee, zone.label, pricingConfig);
            setMaterialQuote(quote);
        }
    };

    const handleDownload = () => {
        if (generatedImage) {
            const link = document.createElement("a");
            link.href = generatedImage;
            link.download = `directpavers-simulation-${currentPhotoIndex + 1}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleBuyMaterial = () => {
        trackEvent(EVENTS.CTA_CLICKED, { type: 'buy_material' });
        const lastDone = [...photoEntries].reverse().find(e => e.done);
        if (lastDone?.variant?.shopifyUrl) {
            window.open(lastDone.variant.shopifyUrl, '_blank');
        } else {
            window.open('https://directpavers.com', '_blank');
        }
    };

    const handleSeeLaborCost = () => {
        const sqft = width * length;
        const labor = calculateLaborQuote(sqft, pricingConfig);
        setLaborQuote(labor);
        trackEvent(EVENTS.QUOTE_VIEWED, { type: 'labor', total: labor.laborCost });
        advanceStep("labor-quote");
    };

    const handleTalkToOwner = () => {
        trackEvent(EVENTS.CTA_CLICKED, { type: 'whatsapp' });
        const phone = pricingConfig.ownerWhatsapp.replace(/[^0-9]/g, '');
        const doneEntries = photoEntries.filter(e => e.done);
        const productList = doneEntries.map(e => `- ${e.product?.name} (${e.variant?.name})`).join('\n');
        const leadInfo = leadData ? `Name: ${leadData.name}\nEmail: ${leadData.email}\n` : '';
        const message = encodeURIComponent(
            `Hi! I'm interested in a paver project.\n` +
            `${leadInfo}` +
            `Products:\n${productList}\n` +
            `Area: ${width * length} sq ft\n` +
            `Can we discuss the details?`
        );
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    };

    const handleRestart = () => {
        changeStep("welcome");
        setCompletedSteps(new Set());
        setPhotos([]);
        setWidth(0);
        setLength(0);
        setPhotoEntries([]);
        setCurrentPhotoIndex(0);
        resetPhotoSelection();
        setIsGenerating(false);
        setSelectedZone(deliveryZones[0] || null);
        setMaterialQuote(null);
        setLaborQuote(null);
        setLeadData(null);
        setIsTyping(false);
    };

    const isStepDone = (step: Step) => completedSteps.has(step);
    const isStepActive = (step: Step) => currentStep === step;

    const currentPhotoEntry = photoEntries[currentPhotoIndex];
    const donePhotoEntries = photoEntries.filter(e => e.done);

    return (
        <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-3 md:px-4 py-4 md:py-6 space-y-3 md:space-y-4 scroll-smooth"
        >
            {/* Restart button */}
            {currentStep !== "welcome" && (
                <div className="flex justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRestart}
                        className="text-xs text-muted-foreground hover:text-foreground"
                    >
                        <RotateCcw className="mr-1.5 h-3 w-3" />
                        Start Over
                    </Button>
                </div>
            )}

            {/* Welcome */}
            {(isStepActive("welcome") || isStepDone("welcome")) && (
                <StepWelcome
                    onStart={() => advanceStep("photos")}
                    answered={isStepDone("welcome")}
                />
            )}

            {/* Photos */}
            {(isStepActive("photos") || isStepDone("photos")) && (
                <StepPhotos
                    photos={photos}
                    onPhotosChange={setPhotos}
                    onContinue={() => advanceStep("measurements")}
                    answered={isStepDone("photos")}
                />
            )}

            {/* Measurements */}
            {(isStepActive("measurements") || isStepDone("measurements")) && (
                <StepMeasurements
                    width={width}
                    length={length}
                    onMeasurementsChange={(w, l) => { setWidth(w); setLength(l); }}
                    onContinue={handlePhotosConfirmed}
                    answered={isStepDone("measurements")}
                />
            )}

            {/* Lead Capture */}
            {(isStepActive("lead-capture") || isStepDone("lead-capture")) && (
                <StepLeadCapture
                    onSubmit={handleLeadSubmit}
                    onSkip={handleLeadSkip}
                    answered={isStepDone("lead-capture")}
                    answeredData={leadData}
                    isRequired={pricingConfig.requireLeadCapture}
                />
            )}

            {/* Per-photo: show completed photo entries */}
            {donePhotoEntries.map((entry, i) => (
                <div key={`done-photo-${i}`}>
                    <ChatMessage type="bot">
                        <p className="font-medium text-xs text-muted-foreground mb-1">Photo {i + 1} of {photoEntries.length}</p>
                        <p>Choose your paver style and color.</p>
                    </ChatMessage>
                    <ChatMessage type="user">
                        <div className="flex items-center gap-3">
                            <img src={entry.variant?.textureUrl} alt="" className="w-10 h-10 rounded-lg object-cover border" />
                            <div>
                                <p className="font-medium text-sm">{entry.product?.name}</p>
                                <p className="text-xs opacity-80">{entry.variant?.name}</p>
                            </div>
                        </div>
                    </ChatMessage>
                    {entry.generatedImage && (
                        <>
                            <ChatMessage type="bot">
                                <p className="text-sm">Here&apos;s your visualization for photo {i + 1}!</p>
                            </ChatMessage>
                            <div className="mx-2 rounded-xl overflow-hidden border shadow-sm">
                                <img src={entry.generatedImage} alt={`Simulation ${i + 1}`} className="w-full" />
                            </div>
                            <ChatMessage type="user">Approved!</ChatMessage>
                        </>
                    )}
                </div>
            ))}

            {/* Current photo: Product Selection */}
            {(isStepActive("photo-product")) && currentPhotoEntry && (
                <>
                    <ChatMessage type="bot">
                        <div className="flex items-start gap-3">
                            <img src={currentPhotoEntry.photo} alt={`Photo ${currentPhotoIndex + 1}`} className="w-16 h-16 rounded-lg object-cover border flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-sm">Photo {currentPhotoIndex + 1} of {photoEntries.length}</p>
                                <p className="text-muted-foreground text-xs mt-1">Choose a paver style and color for this area.</p>
                            </div>
                        </div>
                    </ChatMessage>
                    <StepProductSelect
                        products={products}
                        activeManufacturer={activeManufacturer}
                        selectedProduct={selectedProduct}
                        selectedVariant={selectedVariant}
                        onManufacturerChange={(id) => {
                            setActiveManufacturer(id);
                            setSelectedProduct(null);
                            setSelectedVariant(null);
                        }}
                        onProductSelect={handleProductSelect}
                        onVariantSelect={setSelectedVariant}
                        onGenerate={handleGenerate}
                        answered={false}
                    />
                </>
            )}

            {/* Current photo: Simulation */}
            {(isStepActive("photo-simulation")) && currentPhotoEntry && selectedProduct && selectedVariant && (
                <StepSimulation
                    originalImage={currentPhotoEntry.photo}
                    generatedImage={generatedImage}
                    isGenerating={isGenerating}
                    product={selectedProduct}
                    variant={selectedVariant}
                    onShowQuote={handleShowQuote}
                    onTryAnother={handleTryAnother}
                    onDownload={handleDownload}
                    answered={false}
                    isLastPhoto={currentPhotoIndex === photoEntries.length - 1}
                />
            )}

            {/* Material Quote */}
            {(isStepActive("material-quote") || isStepDone("material-quote")) && (
                <StepMaterialQuote
                    quote={materialQuote}
                    deliveryZones={deliveryZones}
                    selectedZone={selectedZone}
                    onDeliveryZoneChange={handleDeliveryZoneChange}
                    onBuyMaterial={handleBuyMaterial}
                    onSeeLaborCost={handleSeeLaborCost}
                    answered={isStepDone("material-quote")}
                />
            )}

            {/* Labor Quote */}
            {isStepActive("labor-quote") && materialQuote && laborQuote && (
                <StepLaborQuote
                    materialQuote={materialQuote}
                    laborQuote={laborQuote}
                    ownerPhone={pricingConfig.ownerPhone}
                    ownerWhatsapp={pricingConfig.ownerWhatsapp}
                    onBuyWithLabor={() => {
                        handleBuyMaterial();
                        handleTalkToOwner();
                    }}
                    onBuyMaterialOnly={handleBuyMaterial}
                    onTalkToOwner={handleTalkToOwner}
                />
            )}

            {/* Typing indicator */}
            {isTyping && <TypingIndicator />}

            {/* Bottom spacing */}
            <div className="h-4" />
        </div>
    );
}
