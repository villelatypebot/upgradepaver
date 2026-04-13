"use client";

import { useState, useEffect } from "react";
import { ImageUpload } from "@/components/image-upload";
import { PaverSelector } from "@/components/paver-selector";
import { ComparisonSlider } from "@/components/comparison-slider";
import { getProducts } from "@/lib/storage";
import { PaverProduct, PaverVariant, MANUFACTURERS, ManufacturerId } from "@/config/pavers";
import { Button } from "@/components/ui/button";
import { Loader2, Download, RefreshCcw, Wand2, ArrowRight, Check, MessageCircle, Camera, Ruler, DollarSign } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestSimulation } from "@/lib/simulation-client";

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [products, setProducts] = useState<PaverProduct[]>([]);

  // Selection State
  const [activeManufacturer, setActiveManufacturer] = useState<ManufacturerId>("flagstone");
  const [selectedProduct, setSelectedProduct] = useState<PaverProduct | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<PaverVariant | null>(null);

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [visualizationNotes, setVisualizationNotes] = useState("");
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    async function loadData() {
      const loaded = await getProducts();
      setProducts(loaded);
    }
    loadData();
  }, []);

  // Filter products by active manufacturer
  const displayedProducts = products.filter(p => p.manufacturerId === activeManufacturer);

  const handleProductSelect = (product: PaverProduct) => {
    setSelectedProduct(product);
    // Auto-select first variant
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
      const image = await requestSimulation({
        originalImage: selectedImage,
        paverStyle: `${selectedProduct.name} - ${selectedVariant.name}`,
        paverTexture: selectedVariant.textureUrl,
        customPrompt: selectedProduct.prompt,
        userNotes: visualizationNotes.trim() || undefined,
      });

      setGeneratedImage(image);
      toast.success("Simulation complete!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to generate simulation.";
      console.error('Error:', error);
      toast.error(message);
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Falha ao enviar solicitação.";
      console.error(error);
      toast.error(message);
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
    <div className="min-h-[100dvh] flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-3 md:px-4 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative w-8 h-8 md:w-10 md:h-10">
              <img src="/logo.png" alt="DirectPavers Logo" className="object-contain w-full h-full" />
            </div>
            <span className="font-bold text-base md:text-xl tracking-tight text-foreground">Direct Pavers</span>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-3 md:px-4 py-6 md:py-12">
        {!generatedImage ? (
          <div className="max-w-6xl mx-auto space-y-8 md:space-y-12">
            {/* Hero Text */}
            <div className="text-center space-y-3 md:space-y-4 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
                Visualize Your <span className="text-primary">Dream Patio</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground px-2">
                Upload a photo, choose a manufacturer, and see the transformation.
              </p>
              <Link href="/quote">
                <Button size="lg" className="mt-3 md:mt-4 px-6 md:px-8 text-base md:text-lg h-12 md:h-14 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Get Your Free Quote
                </Button>
              </Link>
            </div>

            {/* Quote Flow Benefits */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-3xl mx-auto">
              {[
                { icon: Camera, label: "Upload Photos", desc: "Show us your space" },
                { icon: Wand2, label: "AI Visualization", desc: "See the result" },
                { icon: Ruler, label: "Enter Measurements", desc: "Area dimensions" },
                { icon: DollarSign, label: "Instant Quote", desc: "Material & labor" },
              ].map((item, i) => (
                <div key={i} className="text-center space-y-1.5 md:space-y-2 p-3 md:p-4 rounded-xl bg-card border shadow-sm">
                  <div className="mx-auto w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  <p className="font-semibold text-xs md:text-sm">{item.label}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Separator className="my-4 max-w-xs mx-auto" />
              <p className="text-sm text-muted-foreground mb-2">Or try a quick visualization below</p>
            </div>

            <div className="grid lg:grid-cols-12 gap-6 md:gap-8 items-start">
              {/* Left: Upload */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                  <h2 className="text-lg md:text-xl font-semibold">Upload Photo</h2>
                </div>
                <ImageUpload
                  selectedImage={selectedImage}
                  onImageSelect={setSelectedImage}
                />
              </div>

              {/* Divider for mobile */}
              <div className="hidden lg:flex lg:col-span-1 justify-center pt-20">
                <ArrowRight className="text-muted-foreground/30 w-8 h-8" />
              </div>

              {/* Right: Select & Generate */}
              <div className="lg:col-span-6 space-y-4 md:space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                  <h2 className="text-lg md:text-xl font-semibold">Select Products</h2>
                </div>

                {/* Manufacturer Tabs */}
                <div className="flex bg-muted p-1 rounded-lg w-full overflow-x-auto">
                  {MANUFACTURERS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setActiveManufacturer(m.id);
                        setSelectedProduct(null);
                        setSelectedVariant(null);
                      }}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-2 md:px-3 py-2 text-xs md:text-sm font-medium rounded-md transition-all whitespace-nowrap",
                        activeManufacturer === m.id ? "bg-white text-primary shadow-sm ring-1 ring-black/5" : "hover:text-foreground text-muted-foreground"
                      )}
                    >
                      <img src={m.logo} alt={m.name} className="w-4 h-4 md:w-5 md:h-5 object-contain" />
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
                  <p className="text-center text-muted-foreground py-6 md:py-8 border-2 border-dashed rounded-xl text-sm">
                    No products available for this manufacturer.
                  </p>
                )}

                {/* Variant Selector */}
                {selectedProduct && selectedProduct.variants.length > 0 && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300 bg-card border rounded-xl p-3 md:p-4 shadow-sm">
                    <h3 className="text-xs md:text-sm font-semibold mb-2 md:mb-3 flex items-center gap-2">
                      Select Color: <span className="text-primary">{selectedVariant?.name}</span>
                    </h3>
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      {selectedProduct.variants.map(variant => (
                        <button
                          key={variant.id}
                          onClick={() => setSelectedVariant(variant)}
                          className={cn(
                            "relative w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
                            selectedVariant?.id === variant.id ? "border-primary ring-2 ring-primary/20 scale-105" : "border-transparent opacity-80 hover:opacity-100"
                          )}
                          title={variant.name}
                        >
                          <img src={variant.textureUrl} alt={variant.name} className="w-full h-full object-cover" />
                          {selectedVariant?.id === variant.id && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <div className="bg-primary text-primary-foreground rounded-full p-0.5">
                                <Check className="w-3 h-3" />
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    {selectedProduct.description && (
                      <p className="mt-2 md:mt-3 text-xs md:text-sm text-muted-foreground">{selectedProduct.description}</p>
                    )}
                  </div>
                )}

                {selectedProduct && selectedVariant && (
                  <div className="rounded-xl border bg-card p-3 md:p-4 shadow-sm space-y-2">
                    <div>
                      <h3 className="text-sm font-semibold">Optional notes for the AI</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">Mention grass to replace or any area that should stay untouched.</p>
                    </div>
                    <textarea
                      value={visualizationNotes}
                      onChange={e => setVisualizationNotes(e.target.value)}
                      placeholder="Example: Replace the grass by the pool deck too, but keep the planting bed on the right side unchanged."
                      className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm outline-none transition focus:border-primary focus:bg-white resize-y"
                    />
                  </div>
                )}

                <Separator className="my-4 md:my-6" />

                <Button
                  size="lg"
                  className="w-full text-base md:text-lg h-12 md:h-14 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                  onClick={handleGenerate}
                  disabled={!selectedImage || !selectedProduct || !selectedVariant || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Designing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-5 w-5" />
                      Generate Visualization
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">Your Design</h2>
                <p className="text-sm md:text-base text-muted-foreground">Drag the slider to compare before & after.</p>
              </div>
              <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                <Button variant="outline" onClick={() => { setGeneratedImage(null); setIsSubmitted(false); }} className="flex-1 md:flex-none">
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Edit / Reset
                </Button>
                <Button onClick={handleDownload} className="bg-primary hover:bg-primary/90 flex-1 md:flex-none">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>

            <div className="w-full bg-muted/20 rounded-xl border p-1 md:p-2 shadow-inner">
              {selectedImage && generatedImage && (
                <ComparisonSlider
                  original={selectedImage}
                  generated={generatedImage}
                  className="rounded-lg"
                />
              )}
            </div>

            <div className="bg-card p-6 rounded-xl border shadow-sm">
              {!isSubmitted ? (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="font-semibold text-lg">Gostou do resultado? Confirme a Mão de Obra!</h3>
                    <p className="text-muted-foreground">Preencha seus dados para entrarmos em contato com as informações sobre o seu projeto.</p>
                  </div>
                  <form onSubmit={handleConfirmLabor} className="flex flex-col md:flex-row items-end gap-4 w-full">
                    <div className="space-y-2 flex-1 w-full">
                      <Label>Nome Completo</Label>
                      <Input placeholder="Seu nome" value={userName} onChange={e => setUserName(e.target.value)} disabled={isSubmitting} />
                    </div>
                    <div className="space-y-2 flex-1 w-full">
                      <Label>Telefone / WhatsApp</Label>
                      <Input placeholder="(11) 99999-9999" value={userPhone} onChange={e => setUserPhone(e.target.value)} disabled={isSubmitting} />
                    </div>
                    <Button type="submit" size="lg" className="w-full md:w-auto px-8 font-semibold" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                      Confirmar Mão de Obra
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-xl text-green-700">Solicitação Recebida com Sucesso!</h3>
                  <p className="text-muted-foreground">Em breve nossa equipe entrará em contato pelo telefone informado.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t py-4 md:py-6 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <a
            href="https://directpavers.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
          >
            Visit DirectPavers.com
          </a>
          <p className="text-xs text-muted-foreground/50 mt-2">
            &copy; {new Date().getFullYear()} Direct Pavers. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
