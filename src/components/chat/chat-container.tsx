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
import { getProducts } from "@/lib/storage";
import { PaverProduct, PaverVariant, ManufacturerId } from "@/config/pavers";
import { PricingConfig, DEFAULT_PRICING, DEFAULT_DELIVERY_ZONES, DeliveryZone } from "@/config/pricing";
import { calculateMaterialQuote, calculateLaborQuote, MaterialQuote, LaborQuote } from "@/lib/pricing";
import { trackEvent, getSessionId, EVENTS } from "@/lib/analytics";
import { getShopifyVariantId, buildCartUrl, SHOPIFY_STORE_URL } from "@/config/shopify";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { requestSimulation } from "@/lib/simulation-client";
import {
    MeasurementArea,
    createMeasurementArea,
    formatMeasurementAreaLabel,
    getCompletedMeasurementAreas,
    getTotalMeasurementSqft,
} from "@/lib/measurements";

type Step = "welcome" | "photos" | "photo-product" | "photo-simulation" | "measurements" | "material-quote";

interface PhotoEntry {
    photo: string;
    product: PaverProduct | null;
    variant: PaverVariant | null;
    notes: string;
    generatedImage: string | null;
    simulationFailed: boolean;
    simulationError: string | null;
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
    const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(DEFAULT_DELIVERY_ZONES);
    const [photos, setPhotos] = useState<string[]>([]);
    const [measurementAreas, setMeasurementAreas] = useState<MeasurementArea[]>([createMeasurementArea(0)]);

    // Lead capture
    const [leadData, setLeadData] = useState<{ name: string; email: string; phone?: string } | null>(null);
    const [leadCaptureDismissed, setLeadCaptureDismissed] = useState(false);

    // Per-photo state
    const [photoEntries, setPhotoEntries] = useState<PhotoEntry[]>([]);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    // Current photo's selection state
    const [activeManufacturer, setActiveManufacturer] = useState<ManufacturerId>("flagstone");
    const [selectedProduct, setSelectedProduct] = useState<PaverProduct | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<PaverVariant | null>(null);
    const [photoInstructions, setPhotoInstructions] = useState("");
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Quote state
    const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(DEFAULT_DELIVERY_ZONES[0] || null);
    const [materialQuote, setMaterialQuote] = useState<MaterialQuote | null>(null);
    const [laborQuote, setLaborQuote] = useState<LaborQuote | null>(null);

    useEffect(() => {
        getProducts().then(setProducts);
        fetch('/api/pricing').then(r => r.json()).then(data => {
            if (data && !data.error) setPricingConfig(data);
        }).catch(() => { });
        fetch('/api/delivery-zones').then(r => r.json()).then(data => {
            if (Array.isArray(data) && data.length > 0) {
                setDeliveryZones(data);
                setSelectedZone(data[0]);
            }
        }).catch(() => { });
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
            notes: "",
            generatedImage: null,
            simulationFailed: false,
            simulationError: null,
            done: false,
        }));
        setPhotoEntries(entries);
        setCurrentPhotoIndex(0);
        resetPhotoSelection();
        trackEvent(EVENTS.PHOTO_UPLOADED, { count: photos.length });
        advanceStep("photo-product");
    };

    const resetPhotoSelection = (options?: { keepNotes?: boolean }) => {
        setActiveManufacturer("flagstone");
        setSelectedProduct(null);
        setSelectedVariant(null);
        setGeneratedImage(null);
        if (!options?.keepNotes) {
            setPhotoInstructions("");
        }
    };

    const handleLeadSubmit = async (lead: { name: string; email: string; phone?: string }) => {
        setLeadData(lead);
        trackEvent(EVENTS.LEAD_CAPTURED, { source: 'quote' });

        if (typeof window !== "undefined" && window.parent) {
            window.parent.postMessage({ event: 'lead_captured' }, 'https://directpavers.com');
        }

        try {
            await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...lead, session_id: getSessionId(), source: 'quote' }),
            });
            toast.success("We'll keep this quote on file for you.");
        } catch {
            // silent — don't block flow
        }
    };

    const handleLeadSkip = () => {
        setLeadCaptureDismissed(true);
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
            const image = await requestSimulation({
                originalImage: currentPhoto.photo,
                paverStyle: `${selectedProduct.name} - ${selectedVariant.name}`,
                paverTexture: selectedVariant.textureUrl,
                customPrompt: selectedProduct.prompt,
                userNotes: photoInstructions.trim() || undefined,
            });

            setGeneratedImage(image);
            trackEvent(EVENTS.SIMULATION_GENERATED, { product: selectedProduct.name });
            toast.success("Visualization complete!");
            scrollToBottom();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to generate simulation.";
            console.error('Error:', error);
            trackEvent(EVENTS.SIMULATION_FAILED, { error: message });
            setGeneratedImage(null);
            setPhotoEntries(prev => {
                const updated = [...prev];
                const currentEntry = updated[currentPhotoIndex];

                if (!currentEntry) {
                    return prev;
                }

                updated[currentPhotoIndex] = {
                    ...currentEntry,
                    product: selectedProduct,
                    variant: selectedVariant,
                    notes: photoInstructions.trim(),
                    generatedImage: null,
                    simulationFailed: true,
                    simulationError: message,
                    done: true,
                };

                return updated;
            });
            toast.error(`${message} We'll keep going so you can still get your quote.`);
            advanceStep("measurements");
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
            notes: photoInstructions.trim(),
            generatedImage: generatedImage,
            simulationFailed: false,
            simulationError: null,
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
            advanceStep("measurements");
        }
    };

    const handleTryAnother = () => {
        setGeneratedImage(null);
        resetPhotoSelection({ keepNotes: true });
        changeStep("photo-product");
        scrollToBottom();
    };

    const handleContinueFromPreview = () => {
        handlePhotoApproved();
    };

    const handleMeasurementsConfirmed = () => {
        const lastDone = [...photoEntries].reverse().find(entry => entry.done);
        const totalSqft = getTotalMeasurementSqft(measurementAreas);

        if (!lastDone?.product || !lastDone?.variant || !selectedZone) {
            toast.error("Choose a paver style first so we can build your quote.");
            return;
        }

        if (totalSqft <= 0) {
            toast.error("Please enter at least one area measurement.");
            return;
        }

        const quote = calculateMaterialQuote(totalSqft, lastDone.product, lastDone.variant, selectedZone.fee, selectedZone.label, pricingConfig);
        const labor = calculateLaborQuote(totalSqft, pricingConfig);

        setMaterialQuote(quote);
        setLaborQuote(labor);
        trackEvent(EVENTS.QUOTE_VIEWED, { type: 'full', total: quote.materialTotal + labor.laborCost });
        advanceStep("material-quote");
    };

    const handleDeliveryZoneChange = (zone: DeliveryZone) => {
        setSelectedZone(zone);
        const lastDone = [...photoEntries].reverse().find(e => e.done);
        const totalSqft = getTotalMeasurementSqft(measurementAreas);

        if (lastDone?.product && lastDone?.variant && totalSqft > 0) {
            const quote = calculateMaterialQuote(totalSqft, lastDone.product, lastDone.variant, zone.fee, zone.label, pricingConfig);
            setMaterialQuote(quote);
            const labor = calculateLaborQuote(totalSqft, pricingConfig);
            setLaborQuote(labor);
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

    const handleBuyMaterial = async (withLabor: boolean = false) => {
        const type = withLabor ? 'buy_with_labor' : 'buy_material';
        trackEvent(EVENTS.CTA_CLICKED, { type });
        const lastDone = [...photoEntries].reverse().find(e => e.done);
        const completedAreas = getCompletedMeasurementAreas(measurementAreas);
        const areaBreakdown = completedAreas
            .map((area, index) => `${formatMeasurementAreaLabel(area, index)} ${area.width}x${area.length} ft`)
            .join(', ');

        // Fire webhook asynchronously
        if (leadData && lastDone?.product && lastDone?.variant && materialQuote) {
            const payload = {
                name: leadData.name,
                email: leadData.email,
                phone: leadData.phone || "",
                manufacturer: activeManufacturer,
                productName: lastDone.product.name,
                variantName: lastDone.variant.name,
                quoteType: type,
                areaSqft: materialQuote.areaSqft,
                areaBreakdown,
                materialTotal: materialQuote.materialTotal,
                palletsNeeded: materialQuote.palletsNeeded,
                laborCost: laborQuote ? laborQuote.laborCost : 0,
                grandTotal: materialQuote.materialTotal + (laborQuote ? laborQuote.laborCost : 0),
            };

            fetch('/api/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(e => console.error("Webhook error:", e));
        }

        if (!lastDone?.product) {
            window.open(SHOPIFY_STORE_URL, '_blank');
            return;
        }

        // Try name first (map is keyed by product name), then ID as fallback
        const variantId = getShopifyVariantId(lastDone.product.name) || getShopifyVariantId(lastDone.product.id);

        if (!variantId) {
            if (lastDone.variant?.shopifyUrl) {
                window.open(lastDone.variant.shopifyUrl, '_blank');
            } else {
                window.open(SHOPIFY_STORE_URL, '_blank');
            }
            return;
        }

        const quantity = materialQuote?.palletsNeeded || 1;

        let note: string | undefined;
        if (withLabor && laborQuote) {
            const leadInfo = leadData ? `Customer: ${leadData.name}, ${leadData.email}` : '';
            note = [
                'INSTALLATION REQUESTED',
                `Area: ${laborQuote.areaSqft} sq ft`,
                areaBreakdown ? `Areas: ${areaBreakdown}` : '',
                `Estimated labor: $${laborQuote.laborCost.toFixed(2)}`,
                `Labor rate: $${laborQuote.laborRatePerSqft}/sq ft`,
                leadInfo,
                leadData?.phone ? `Phone: ${leadData.phone}` : '',
            ].filter(Boolean).join(' | ');
        }

        const cartUrl = buildCartUrl(variantId, quantity, note);
        if (cartUrl) {
            window.open(cartUrl, '_blank');
        } else {
            window.open(SHOPIFY_STORE_URL, '_blank');
        }
    };


    const handleTalkToOwner = () => {
        trackEvent(EVENTS.CTA_CLICKED, { type: 'sms' });
        const phone = pricingConfig.ownerSms || pricingConfig.ownerPhone;
        if (!phone) {
            toast.error("Contact number not available.");
            return;
        }
        const doneEntries = photoEntries.filter(e => e.done);
        const productList = doneEntries.map(e => `${e.product?.name} (${e.variant?.name})`).join(', ');
        const completedAreas = getCompletedMeasurementAreas(measurementAreas);
        const totalSqft = getTotalMeasurementSqft(measurementAreas);
        const areaBreakdown = completedAreas
            .map((area, index) => `${formatMeasurementAreaLabel(area, index)} ${area.width}x${area.length} ft`)
            .join(', ');
        const leadInfo = leadData ? `${leadData.name}, ${leadData.email}` : '';
        const parts = [
            'Hi! I\'m interested in a paver project.',
            leadInfo ? `${leadInfo}.` : '',
            productList ? `Products: ${productList}.` : '',
            totalSqft > 0 ? `Area: ${totalSqft} sq ft.` : '',
            areaBreakdown ? `Breakdown: ${areaBreakdown}.` : '',
            'Can we discuss the details?',
        ].filter(Boolean).join(' ');
        const message = encodeURIComponent(parts);
        window.open(`sms:${phone}?body=${message}`);
    };

    const handleRestart = () => {
        changeStep("welcome");
        setCompletedSteps(new Set());
        setPhotos([]);
        setMeasurementAreas([createMeasurementArea(0)]);
        setPhotoEntries([]);
        setCurrentPhotoIndex(0);
        resetPhotoSelection();
        setIsGenerating(false);
        setSelectedZone(deliveryZones[0] || DEFAULT_DELIVERY_ZONES[0] || null);
        setMaterialQuote(null);
        setLaborQuote(null);
        setLeadData(null);
        setLeadCaptureDismissed(false);
        setIsTyping(false);
    };

    const isStepDone = (step: Step) => completedSteps.has(step);
    const isStepActive = (step: Step) => currentStep === step;

    const currentPhotoEntry = photoEntries[currentPhotoIndex];
    const donePhotoEntries = photoEntries.filter(e => e.done);

    return (
        <div className="flex-1 flex flex-col min-h-0">
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-3 md:px-4 py-4 md:py-6 space-y-3 md:space-y-4 scroll-smooth"
            >
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
                        onContinue={handlePhotosConfirmed}
                        answered={isStepDone("photos")}
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
                        {entry.simulationFailed && (
                            <ChatMessage type="bot">
                                <p className="text-sm">
                                    {entry.simulationError || `We couldn't generate the preview for photo ${i + 1}.`} We kept your selection and continued with the quote flow.
                                </p>
                            </ChatMessage>
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
                            notes={photoInstructions}
                            onManufacturerChange={(id) => {
                                setActiveManufacturer(id);
                                setSelectedProduct(null);
                                setSelectedVariant(null);
                            }}
                            onProductSelect={handleProductSelect}
                            onVariantSelect={setSelectedVariant}
                            onNotesChange={setPhotoInstructions}
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
                        onContinue={handleContinueFromPreview}
                        onTryAnother={handleTryAnother}
                        onDownload={handleDownload}
                        answered={false}
                        isLastPhoto={currentPhotoIndex === photoEntries.length - 1}
                    />
                )}

                {/* Measurements */}
                {(isStepActive("measurements") || isStepDone("measurements")) && (
                    <StepMeasurements
                        areas={measurementAreas}
                        onAreasChange={setMeasurementAreas}
                        onContinue={handleMeasurementsConfirmed}
                        answered={isStepDone("measurements")}
                        previewUnavailable={photoEntries.some((entry) => entry.simulationFailed) && !photoEntries.some((entry) => entry.generatedImage)}
                    />
                )}

                {/* Material + Labor Quote (unified) */}
                {(isStepActive("material-quote") || isStepDone("material-quote")) && (
                    <StepMaterialQuote
                        quote={materialQuote}
                        laborQuote={laborQuote}
                        measurementAreas={measurementAreas}
                        deliveryZones={deliveryZones}
                        selectedZone={selectedZone}
                        onDeliveryZoneChange={handleDeliveryZoneChange}
                        onBuyMaterial={() => handleBuyMaterial(false)}
                        onBuyWithLabor={() => handleBuyMaterial(true)}
                        onTalkToOwner={handleTalkToOwner}
                        ownerPhone={pricingConfig.ownerPhone}
                        ownerSms={pricingConfig.ownerSms}
                        answered={isStepDone("material-quote")}
                    />
                )}

                {(isStepActive("material-quote") || isStepDone("material-quote")) && !leadData && (pricingConfig.requireLeadCapture || !leadCaptureDismissed) && (
                    <StepLeadCapture
                        onSubmit={handleLeadSubmit}
                        onSkip={handleLeadSkip}
                        answered={Boolean(leadData)}
                        answeredData={leadData}
                        isRequired={pricingConfig.requireLeadCapture}
                    />
                )}

                {/* Typing indicator */}
                {isTyping && <TypingIndicator />}

                {/* Bottom spacing */}
                <div className="h-4" />
            </div>

            {/* Start Over - fixed at bottom */}
            {currentStep !== "welcome" && (
                <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur px-3 md:px-4 py-2 flex justify-center">
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
        </div>
    );
}
