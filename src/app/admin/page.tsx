"use client";

import { useState, useEffect } from "react";
import { PaverProduct, PaverVariant, MANUFACTURERS, ManufacturerId } from "@/config/pavers";
import { getProducts, saveProduct, deleteProduct } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, LogOut, Lock, Palette, Wand2, DollarSign, BarChart3, Users, MapPin, FileText, Settings, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { PricingConfig, DEFAULT_PRICING, DeliveryZone } from "@/config/pricing";

// Prompt Templates
const PROMPT_TEMPLATES = {
    floor: "Transforme esta imagem aplicando o pavimento {productName} no chão / piso da área externa.\n    INSTRUÇÕES:\n- Substitua APENAS a superfície do chão / piso com o padrão de pavimento {productName} mostrado na textura de referência.\n- Mantenha EXATAMENTE a mesma perspectiva, iluminação e sombras realistas da cena original.\n- NÃO altere nenhum outro elementos (móveis, paredes, plantas, piscinas, estruturas).\n- Faça a instalação dos pavers parecer profissional e natural.\n- Os pavers devem seguir perfeitamente os contornos e ângulos do chão existente.\n- Mantenha sombras e reflexos naturais.\n\nO resultado deve parecer uma visualização arquitetônica profissional com os pavimentos {productName} instalados.",
    wall: "Transforme esta imagem aplicando o revestimento {productName} nas paredes verticais ou fachadas visíveis.\n    INSTRUÇÕES:\n- Substitua APENAS as superfícies verticais de parede / fachada com o revestimento {productName} mostrado na textura de referência.\n- Mantenha EXATAMENTE a mesma perspectiva, iluminação e sombras realistas da cena original.\n- NÃO altere o chão, móveis, plantas ou outros elementos.\n- Faça a instalação parecer profissional e natural.\n- Mantenha sombras e reflexos naturais.\n\nO resultado deve parecer uma visualização arquitetônica profissional com o revestimento {productName} instalado.",
    fireplace: "Transforme esta imagem aplicando o revestimento {productName} na lareira ou churrasqueira visível.\n    INSTRUÇÕES:\n- Identifique a estrutura da lareira/churrasqueira e aplique o revestimento {productName}.\n- Mantenha a perspectiva e iluminação originais.\n- Mantenha sombras e reflexos naturais.\n\nO resultado deve parecer uma visualização arquitetônica profissional com o revestimento {productName} instalado.",
    pool: "Transforme esta imagem renovando o deck da piscina com o pavimento {productName}.\n    INSTRUÇÕES:\n- Substitua o piso ao redor da piscina pelo pavimento {productName}.\n- Mantenha a água da piscina e outros elementos intactos.\n- Mantenha a perspectiva e iluminação originais.\n\nO resultado deve parecer uma visualização arquitetônica profissional.",
    custom: ""
};

type PromptType = "floor" | "wall" | "fireplace" | "pool" | "custom";
type AdminTab = "dashboard" | "products" | "pricing" | "leads" | "logs" | "settings";

const NAV_ITEMS: { id: AdminTab; label: string; icon: any }[] = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "products", label: "Products", icon: Palette },
    { id: "pricing", label: "Pricing", icon: DollarSign },
    { id: "leads", label: "Leads", icon: Users },
    { id: "logs", label: "Logs", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
];

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [products, setProducts] = useState<PaverProduct[]>([]);

    // Product Form State
    const [editingProduct, setEditingProduct] = useState<PaverProduct | null>(null);
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newManufacturer, setNewManufacturer] = useState<ManufacturerId>("flagstone");
    const [promptType, setPromptType] = useState<PromptType>("floor");
    const [customPrompt, setCustomPrompt] = useState("");
    const [newVariants, setNewVariants] = useState<PaverVariant[]>([]);
    const [vName, setVName] = useState("");
    const [vTexture, setVTexture] = useState("");
    const [vExample, setVExample] = useState("");

    // Tabs
    const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
    const [logs, setLogs] = useState<any[]>([]);
    const [apiKey, setApiKey] = useState("");

    // Pricing
    const [pricingConfig, setPricingConfig] = useState<PricingConfig>(DEFAULT_PRICING);
    const [pricingLoaded, setPricingLoaded] = useState(false);

    // Delivery Zones
    const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
    const [zonesLoaded, setZonesLoaded] = useState(false);
    const [newZoneLabel, setNewZoneLabel] = useState("");
    const [newZoneFee, setNewZoneFee] = useState(0);

    // Leads
    const [leads, setLeads] = useState<any[]>([]);
    const [leadsLoaded, setLeadsLoaded] = useState(false);

    // Dashboard
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [dashboardLoaded, setDashboardLoaded] = useState(false);

    useEffect(() => {
        async function init() { setProducts(await getProducts()); }
        init();
        const auth = sessionStorage.getItem("admin_auth");
        if (auth === "true") setIsAuthenticated(true);
    }, []);

    useEffect(() => {
        if (promptType !== "custom") {
            const template = PROMPT_TEMPLATES[promptType];
            setCustomPrompt(template.replaceAll("{productName}", newName || "SEU PRODUTO"));
        }
    }, [promptType, newName]);

    useEffect(() => {
        if (!isAuthenticated) return;
        if (activeTab === "dashboard" && !dashboardLoaded) loadDashboard();
        if (activeTab === "pricing" && !pricingLoaded) { loadPricing(); loadZones(); }
        if (activeTab === "leads" && !leadsLoaded) loadLeads();
        if (activeTab === "logs") loadLogs();
    }, [activeTab, isAuthenticated, dashboardLoaded, pricingLoaded, leadsLoaded]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === "admin123") {
            setIsAuthenticated(true);
            sessionStorage.setItem("admin_auth", "true");
            toast.success("Welcome back!");
        } else { toast.error("Invalid password"); }
    };

    const handleLogout = () => { setIsAuthenticated(false); sessionStorage.removeItem("admin_auth"); };

    // ─── Product Handlers ───
    const handleAddVariant = () => {
        if (!vName || !vTexture || !vExample) { toast.error("Fill all variant fields"); return; }
        setNewVariants([...newVariants, { id: `var-${Date.now()}`, name: vName, textureUrl: vTexture, exampleUrl: vExample }]);
        setVName(""); setVTexture(""); setVExample(""); toast.success("Variant added");
    };
    const handleRemoveVariant = (id: string) => setNewVariants(newVariants.filter(v => v.id !== id));
    const handleEditProduct = (p: PaverProduct) => {
        setEditingProduct(p); setNewName(p.name); setNewDesc(p.description || "");
        setNewManufacturer(p.manufacturerId); setNewVariants([...p.variants]);
        if (p.prompt) { setCustomPrompt(p.prompt); setPromptType("custom"); } else setPromptType("floor");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const handleCancelEdit = () => {
        setEditingProduct(null); setNewName(""); setNewDesc(""); setNewManufacturer("flagstone");
        setNewVariants([]); setPromptType("floor"); setCustomPrompt("");
    };
    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newManufacturer) { toast.error("Name and manufacturer required"); return; }
        if (newVariants.length === 0) { toast.error("Add at least one variant"); return; }
        const product: PaverProduct = {
            id: editingProduct ? editingProduct.id : `product-${Date.now()}`,
            name: newName, description: newDesc, manufacturerId: newManufacturer,
            prompt: customPrompt, variants: newVariants
        };
        setProducts(await saveProduct(product)); handleCancelEdit();
        toast.success(editingProduct ? "Updated!" : "Created!");
    };
    const handleDeleteProduct = async (id: string) => {
        if (!confirm("Delete this product?")) return;
        setProducts(await deleteProduct(id));
        if (editingProduct?.id === id) handleCancelEdit();
        toast.success("Deleted");
    };

    // ─── Data Loaders ───
    const loadLogs = async () => { try { const r = await fetch('/api/admin/config?type=logs'); setLogs(await r.json()); } catch {} };
    const loadPricing = async () => {
        try { const r = await fetch('/api/pricing'); const d = await r.json(); if (d && !d.error) { setPricingConfig(d); setPricingLoaded(true); } } catch {}
    };
    const loadZones = async () => {
        try { const r = await fetch('/api/delivery-zones?all=true'); const d = await r.json(); if (Array.isArray(d)) { setDeliveryZones(d); setZonesLoaded(true); } } catch {}
    };
    const loadLeads = async () => {
        try { const r = await fetch('/api/leads'); const d = await r.json(); if (Array.isArray(d)) { setLeads(d); setLeadsLoaded(true); } } catch {}
    };
    const loadDashboard = async () => {
        try { const r = await fetch('/api/analytics?days=30'); const d = await r.json(); if (d) { setDashboardData(d); setDashboardLoaded(true); } } catch {}
    };

    // ─── Pricing/Zone/Lead Handlers ───
    const handleSavePricing = async (configOverride?: PricingConfig) => {
        try {
            const toSave = configOverride || pricingConfig;
            const r = await fetch('/api/pricing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toSave) });
            const d = await r.json(); !d.error ? toast.success("Pricing saved!") : toast.error("Failed");
        } catch { toast.error("Error saving"); }
    };
    const handleSaveConfig = async () => {
        try {
            const r = await fetch('/api/admin/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ googleAiApiKey: apiKey }) });
            const d = await r.json(); d.success ? (toast.success("Saved!"), setApiKey("")) : toast.error("Failed");
        } catch { toast.error("Error"); }
    };
    const handleAddZone = async () => {
        if (!newZoneLabel) { toast.error("Label required"); return; }
        try {
            const name = newZoneLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const r = await fetch('/api/delivery-zones', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, label: newZoneLabel, fee: newZoneFee, sort_order: deliveryZones.length + 1, active: true }) });
            const d = await r.json(); if (Array.isArray(d)) { setDeliveryZones(d); setNewZoneLabel(""); setNewZoneFee(0); toast.success("Zone added!"); }
        } catch { toast.error("Error"); }
    };
    const handleDeleteZone = async (id: string) => {
        if (!confirm("Delete this zone?")) return;
        try {
            const r = await fetch('/api/delivery-zones', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
            const d = await r.json(); if (Array.isArray(d)) { setDeliveryZones(d); toast.success("Deleted"); }
        } catch { toast.error("Error"); }
    };
    const handleUpdateLeadStatus = async (id: string, status: string) => {
        try {
            await fetch('/api/leads', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
            setLeads(leads.map(l => l.id === id ? { ...l, status } : l)); toast.success("Updated");
        } catch { toast.error("Error"); }
    };

    // ─── Login Screen ───
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center gap-2"><Lock className="w-6 h-6 text-primary" />Admin Access</CardTitle>
                        <CardDescription>Enter password to manage system</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <Label>Password</Label>
                            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                            <Button type="submit" className="w-full">Login</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const FUNNEL_STEPS = [
        { key: "welcome", label: "Welcome" }, { key: "photos", label: "Photos" },
        { key: "measurements", label: "Measurements" }, { key: "lead-capture", label: "Lead Capture" },
        { key: "photo-product", label: "Product Select" }, { key: "photo-simulation", label: "Simulation" },
        { key: "material-quote", label: "Material Quote" }, { key: "labor-quote", label: "Labor Quote" },
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row">
            {/* Sidebar - desktop */}
            <aside className="hidden md:flex w-56 border-r bg-card flex-col sticky top-0 h-screen">
                <div className="p-4 border-b flex items-center gap-2">
                    <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
                    <span className="font-bold text-sm">Direct Pavers</span>
                </div>
                <nav className="flex-1 py-2">
                    {NAV_ITEMS.map(item => (
                        <button key={item.id} onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all ${
                                activeTab === item.id ? "bg-primary/10 text-primary border-r-2 border-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}>
                            <item.icon className="w-4 h-4" />{item.label}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t">
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-muted-foreground">
                        <LogOut className="mr-2 h-4 w-4" />Logout
                    </Button>
                </div>
            </aside>

            {/* Mobile header */}
            <header className="md:hidden sticky top-0 z-50 bg-card border-b px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
                    <span className="font-bold text-sm">Admin</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground h-8 px-2">
                    <LogOut className="h-4 w-4" />
                </Button>
            </header>

            {/* Main */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
                <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">

                {/* ═══ DASHBOARD ═══ */}
                {activeTab === "dashboard" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
                            <Button variant="outline" size="sm" onClick={() => { setDashboardLoaded(false); loadDashboard(); }}>Refresh</Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            {[
                                { label: "Sessions (30d)", value: dashboardData?.totalSessions || 0, icon: BarChart3 },
                                { label: "Leads", value: dashboardData?.totalLeads || 0, icon: Users },
                                { label: "Simulations", value: dashboardData?.simulationStats?.success || 0, icon: Wand2 },
                                { label: "CTA Clicks", value: Object.values(dashboardData?.ctaClicks || {}).reduce((a: number, b: any) => a + (b as number), 0) || 0, icon: DollarSign },
                            ].map((s, i) => (
                                <Card key={i}><CardContent className="pt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><s.icon className="w-5 h-5 text-primary" /></div>
                                        <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
                                    </div>
                                </CardContent></Card>
                            ))}
                        </div>
                        <Card>
                            <CardHeader><CardTitle className="text-base">Conversion Funnel (30 days)</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {FUNNEL_STEPS.map(step => {
                                        const count = dashboardData?.funnel?.[step.key] || 0;
                                        const maxCount = dashboardData?.funnel?.["welcome"] || 1;
                                        const pct = Math.round((count / maxCount) * 100);
                                        return (
                                            <div key={step.key} className="flex items-center gap-2 md:gap-3">
                                                <span className="text-[10px] md:text-xs w-20 md:w-28 text-right text-muted-foreground truncate">{step.label}</span>
                                                <div className="flex-1 bg-muted rounded-full h-5 md:h-6 overflow-hidden">
                                                    <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${Math.max(pct, 2)}%` }} />
                                                </div>
                                                <span className="text-[10px] md:text-xs font-mono w-16 md:w-20 text-right">{count} ({pct}%)</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <Card>
                                <CardHeader><CardTitle className="text-base">Popular Products</CardTitle></CardHeader>
                                <CardContent>
                                    {!(dashboardData?.popularProducts?.length) && <p className="text-sm text-muted-foreground">No data yet</p>}
                                    <div className="space-y-2">
                                        {(dashboardData?.popularProducts || []).map((p: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between py-1">
                                                <span className="text-sm">{p.name}</span>
                                                <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full">{p.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle className="text-base">Recent Leads</CardTitle></CardHeader>
                                <CardContent>
                                    {!(dashboardData?.recentLeads?.length) && <p className="text-sm text-muted-foreground">No leads yet</p>}
                                    <div className="space-y-2">
                                        {(dashboardData?.recentLeads || []).slice(0, 5).map((l: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between py-1">
                                                <div><p className="text-sm font-medium">{l.name}</p><p className="text-xs text-muted-foreground">{l.email}</p></div>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${l.status === 'new' ? 'bg-blue-100 text-blue-700' : l.status === 'contacted' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{l.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* ═══ PRODUCTS ═══ */}
                {activeTab === "products" && (
                    <div className="grid lg:grid-cols-12 gap-4 md:gap-8">
                        <div className="lg:col-span-5 space-y-4 md:space-y-6">
                            <Card className={editingProduct ? "border-primary" : ""}>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle>{editingProduct ? "Edit Product" : "Add Product"}</CardTitle>
                                        {editingProduct && <Button variant="ghost" size="sm" onClick={handleCancelEdit}>Cancel</Button>}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSaveProduct} className="space-y-5">
                                        <div className="space-y-2"><Label>Manufacturer</Label>
                                            <Select value={newManufacturer} onValueChange={(v: ManufacturerId) => setNewManufacturer(v)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>{MANUFACTURERS.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2"><Label>Name</Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Eco-CityLock" /></div>
                                        <div className="space-y-2"><Label>Description</Label><Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Short description" /></div>
                                        <div className="border rounded-lg p-4 bg-yellow-50/50 space-y-3">
                                            <Label className="flex items-center gap-2"><Wand2 className="w-4 h-4 text-amber-500" /> AI Prompt</Label>
                                            <Select value={promptType} onValueChange={(v: PromptType) => setPromptType(v)}>
                                                <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="floor">Floor / Patio</SelectItem><SelectItem value="wall">Wall</SelectItem>
                                                    <SelectItem value="fireplace">Fireplace</SelectItem><SelectItem value="pool">Pool</SelectItem>
                                                    <SelectItem value="custom">Custom</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <textarea value={customPrompt} onChange={e => { setCustomPrompt(e.target.value); setPromptType("custom"); }}
                                                className="w-full min-h-[80px] p-2 text-xs rounded-md border bg-white resize-y font-mono" />
                                        </div>
                                        <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                                            <Label className="flex items-center gap-2"><Palette className="w-4 h-4" /> Variants ({newVariants.length})</Label>
                                            <div className="space-y-2">
                                                <Input value={vName} onChange={e => setVName(e.target.value)} placeholder="Color Name" className="bg-white" />
                                                <Input value={vTexture} onChange={e => setVTexture(e.target.value)} placeholder="Texture URL" className="bg-white" />
                                                <Input value={vExample} onChange={e => setVExample(e.target.value)} placeholder="Preview URL" className="bg-white" />
                                                <Button type="button" size="sm" variant="secondary" onClick={handleAddVariant} className="w-full">Add Variant</Button>
                                            </div>
                                            {newVariants.length > 0 && (
                                                <div className="space-y-1 max-h-[120px] overflow-y-auto">
                                                    {newVariants.map(v => (
                                                        <div key={v.id} className="flex items-center gap-2 bg-white p-1.5 rounded border text-xs">
                                                            <img src={v.exampleUrl} className="w-5 h-5 rounded object-cover" />
                                                            <span className="flex-1 truncate">{v.name}</span>
                                                            <Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => handleRemoveVariant(v.id)}><Trash2 className="w-3 h-3" /></Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <Button type="submit" className="w-full" disabled={!newVariants.length}>{editingProduct ? "Update" : "Save"}</Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-7">
                            <Card className="h-full">
                                <CardHeader><CardTitle>Products</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="h-[600px] pr-4 overflow-y-auto">
                                        {MANUFACTURERS.map(m => (
                                            <div key={m.id} className="mb-6">
                                                {products.some(p => p.manufacturerId === m.id) && (<>
                                                    <div className="flex items-center gap-2 mb-3"><img src={m.logo} alt={m.name} className="h-5 object-contain" /><h3 className="font-bold">{m.name}</h3></div>
                                                    <div className="grid gap-3">
                                                        {products.filter(p => p.manufacturerId === m.id).map(p => (
                                                            <div key={p.id} className={`border rounded-lg p-3 transition shadow-sm bg-card ${editingProduct?.id === p.id ? 'ring-2 ring-primary' : 'hover:bg-muted/30'}`}>
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <div>
                                                                        <h4 className="font-semibold text-sm flex items-center gap-2">{p.name}
                                                                            {editingProduct?.id === p.id && <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Editing</span>}
                                                                        </h4>
                                                                        <p className="text-xs text-muted-foreground">{p.description}</p>
                                                                    </div>
                                                                    <div className="flex gap-1">
                                                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditProduct(p)}><Wand2 className="w-3.5 h-3.5" /></Button>
                                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteProduct(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-wrap gap-1.5 mt-1">{p.variants.map(v => <img key={v.id} src={v.exampleUrl} title={v.name} className="w-7 h-7 rounded-full border object-cover" />)}</div>
                                                            </div>
                                                        ))}
                                                    </div><hr className="my-4 border-muted" />
                                                </>)}
                                            </div>
                                        ))}
                                        {!products.length && <p className="text-center text-muted-foreground py-10">No products.</p>}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* ═══ PRICING ═══ */}
                {activeTab === "pricing" && (
                    <div className="max-w-3xl space-y-4 md:space-y-6">
                        <h1 className="text-xl md:text-2xl font-bold">Pricing</h1>
                        <Card>
                            <CardHeader><CardTitle className="text-base">General</CardTitle></CardHeader>
                            <CardContent className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Labor Rate ($/sqft)</Label>
                                        <div className="flex items-center gap-1"><span className="text-muted-foreground">$</span>
                                            <Input type="number" step="0.50" min="0" value={pricingConfig.laborRatePerSqft} onChange={e => setPricingConfig({ ...pricingConfig, laborRatePerSqft: Number(e.target.value) })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2"><Label>Waste %</Label>
                                        <div className="flex items-center gap-1"><Input type="number" min="0" max="50" value={pricingConfig.wastePercentage} onChange={e => setPricingConfig({ ...pricingConfig, wastePercentage: Number(e.target.value) })} /><span className="text-muted-foreground">%</span></div>
                                    </div>
                                </div>
                                <div className="border-t pt-4">
                                    <Label className="font-semibold mb-3 block">Contact</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1"><Label className="text-xs text-muted-foreground">Phone</Label><Input value={pricingConfig.ownerPhone} onChange={e => setPricingConfig({ ...pricingConfig, ownerPhone: e.target.value })} /></div>
                                        <div className="space-y-1"><Label className="text-xs text-muted-foreground">WhatsApp</Label><Input value={pricingConfig.ownerWhatsapp} onChange={e => setPricingConfig({ ...pricingConfig, ownerWhatsapp: e.target.value })} /></div>
                                    </div>
                                </div>
                                <div className="border-t pt-4 flex items-center justify-between">
                                    <div><Label className="font-semibold">Lead Capture</Label><p className="text-xs text-muted-foreground">Ask name & email during quote</p></div>
                                    <button onClick={() => {
                                        const updated = { ...pricingConfig, requireLeadCapture: !pricingConfig.requireLeadCapture };
                                        setPricingConfig(updated);
                                        handleSavePricing(updated);
                                    }}
                                        className={`relative w-11 h-6 rounded-full transition-colors ${pricingConfig.requireLeadCapture ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${pricingConfig.requireLeadCapture ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                                    </button>
                                </div>
                                <Button onClick={() => handleSavePricing()} className="w-full">Save Pricing</Button>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><MapPin className="w-4 h-4 text-primary" />Delivery Zones</CardTitle>
                                <CardDescription>Dynamic delivery areas and fees</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {deliveryZones.map(z => (
                                    <div key={z.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                        <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                                        <div className="flex-1"><p className="font-medium text-sm">{z.label}</p></div>
                                        <span className="font-mono text-sm font-medium">${z.fee}</span>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteZone(z.id)}><X className="w-4 h-4" /></Button>
                                    </div>
                                ))}
                                <div className="border-t pt-3">
                                    <Label className="text-sm font-semibold mb-2 block">Add Zone</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        <Input value={newZoneLabel} onChange={e => setNewZoneLabel(e.target.value)} placeholder="e.g. Miami (+ 25mi)" />
                                        <div className="flex items-center gap-1"><span className="text-muted-foreground">$</span><Input type="number" min="0" value={newZoneFee} onChange={e => setNewZoneFee(Number(e.target.value))} /></div>
                                        <Button onClick={handleAddZone} disabled={!newZoneLabel} className="w-full sm:w-auto"><Plus className="mr-1 h-4 w-4" />Add</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ═══ LEADS ═══ */}
                {activeTab === "leads" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h1 className="text-xl md:text-2xl font-bold">Leads ({leads.length})</h1>
                            <Button variant="outline" size="sm" onClick={() => { setLeadsLoaded(false); loadLeads(); }}>Refresh</Button>
                        </div>
                        <Card><CardContent className="pt-6">
                            <div className="border rounded-md divide-y max-h-[600px] overflow-y-auto">
                                {!leads.length && <p className="p-6 text-center text-muted-foreground">No leads yet.</p>}
                                {leads.map((l: any) => (
                                    <div key={l.id} className="p-3 md:p-4 hover:bg-muted/30 transition">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><Users className="w-4 h-4 text-primary" /></div>
                                            <div className="flex-1 min-w-0"><p className="font-medium text-sm">{l.name}</p><p className="text-xs text-muted-foreground truncate">{l.email}{l.phone && ` · ${l.phone}`}</p></div>
                                            <select value={l.status} onChange={e => handleUpdateLeadStatus(l.id, e.target.value)}
                                                className={`text-[11px] px-2 py-1 rounded-full border-0 font-medium cursor-pointer ${l.status === 'new' ? 'bg-blue-100 text-blue-700' : l.status === 'contacted' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                                <option value="new">New</option><option value="contacted">Contacted</option><option value="converted">Converted</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1.5 ml-12">
                                            <span className="text-[10px] bg-muted px-2 py-0.5 rounded">{l.source}</span>
                                            <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent></Card>
                    </div>
                )}

                {/* ═══ LOGS ═══ */}
                {activeTab === "logs" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between"><h1 className="text-xl md:text-2xl font-bold">Activity Logs</h1><Button variant="outline" size="sm" onClick={loadLogs}>Refresh</Button></div>
                        <Card><CardContent className="pt-6">
                            <div className="border rounded-md divide-y max-h-[600px] overflow-y-auto">
                                {!logs.length && <p className="p-4 text-center text-muted-foreground">No logs.</p>}
                                {logs.map((log: any, i) => (
                                    <div key={i} className="p-4 flex justify-between gap-4 text-sm hover:bg-muted/50">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{log.status}</span>
                                                <span className="font-medium">{log.action}</span>
                                            </div>
                                            <p className="text-muted-foreground text-xs font-mono">{JSON.stringify(log.details)}</p>
                                        </div>
                                        <div className="text-muted-foreground text-xs whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                        </CardContent></Card>
                    </div>
                )}

                {/* ═══ SETTINGS ═══ */}
                {activeTab === "settings" && (
                    <div className="space-y-4 md:space-y-6 max-w-2xl">
                        <h1 className="text-xl md:text-2xl font-bold">Settings</h1>
                        <Card>
                            <CardHeader><CardTitle>Gemini API Key</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex gap-2"><Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Enter new API Key" /><Button onClick={handleSaveConfig}>Save</Button></div>
                                <p className="text-xs text-muted-foreground">Stored securely in database.</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Embed Code</CardTitle></CardHeader>
                            <CardContent>
                                <div className="bg-muted p-3 rounded text-xs font-mono break-all relative group">
                                    {`<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed" width="100%" height="600px" style="border:none;border-radius:12px"></iframe>`}
                                    <Button size="sm" variant="secondary" className="absolute top-1 right-1 h-6 text-xs opacity-0 group-hover:opacity-100" onClick={() => { navigator.clipboard.writeText(`<iframe src="${window.location.origin}/embed" width="100%" height="600px" style="border:none;border-radius:12px;overflow:hidden"></iframe>`); toast.success("Copied!"); }}>Copy</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                </div>
            </main>

            {/* Mobile bottom nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-50 safe-area-pb">
                <div className="flex justify-around py-1">
                    {NAV_ITEMS.slice(0, 5).map(item => (
                        <button key={item.id} onClick={() => setActiveTab(item.id)}
                            className={`flex flex-col items-center gap-0.5 px-2 py-2 text-[10px] font-medium transition-colors min-w-0 ${
                                activeTab === item.id ? "text-primary" : "text-muted-foreground"
                            }`}>
                            <item.icon className="w-5 h-5" />
                            <span className="truncate">{item.label}</span>
                        </button>
                    ))}
                    <button onClick={() => setActiveTab("settings")}
                        className={`flex flex-col items-center gap-0.5 px-2 py-2 text-[10px] font-medium transition-colors min-w-0 ${
                            activeTab === "settings" ? "text-primary" : "text-muted-foreground"
                        }`}>
                        <Settings className="w-5 h-5" />
                        <span className="truncate">Settings</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}
