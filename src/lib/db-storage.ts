
import { PaverProduct, INITIAL_PRODUCTS } from '@/config/pavers';
import { PricingConfig, DEFAULT_PRICING, DeliveryZone, DEFAULT_DELIVERY_ZONES } from '@/config/pricing';
import { supabaseAdmin } from './supabase';

// ─── Products ───────────────────────────────────────────────

export async function getStoredProducts(): Promise<PaverProduct[]> {
    try {
        const { data, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            return INITIAL_PRODUCTS;
        }

        return data as PaverProduct[];
    } catch (error) {
        console.error('Error reading products from Supabase:', error);
        return INITIAL_PRODUCTS;
    }
}

export async function saveStoredProduct(product: PaverProduct): Promise<PaverProduct[]> {
    try {
        const { error } = await supabaseAdmin
            .from('products')
            .upsert(product);

        if (error) throw error;

        return getStoredProducts();
    } catch (error) {
        console.error('Error saving product to Supabase:', error);
        throw error;
    }
}

export async function deleteStoredProduct(id: string): Promise<PaverProduct[]> {
    try {
        const { error } = await supabaseAdmin
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return getStoredProducts();
    } catch (error) {
        console.error('Error deleting product from Supabase:', error);
        throw error;
    }
}

// ─── Pricing Config ─────────────────────────────────────────

export async function getPricingConfig(): Promise<PricingConfig> {
    try {
        const { data, error } = await supabaseAdmin
            .from('pricing_config')
            .select('*')
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (!data) return DEFAULT_PRICING;

        return {
            laborRatePerSqft: data.labor_rate_per_sqft ?? DEFAULT_PRICING.laborRatePerSqft,
            wastePercentage: data.waste_percentage ?? DEFAULT_PRICING.wastePercentage,
            ownerPhone: data.owner_phone ?? DEFAULT_PRICING.ownerPhone,
            ownerWhatsapp: data.owner_whatsapp ?? DEFAULT_PRICING.ownerWhatsapp,
            requireLeadCapture: data.require_lead_capture ?? DEFAULT_PRICING.requireLeadCapture,
        };
    } catch (error) {
        console.error('Error reading pricing config from Supabase:', error);
        return DEFAULT_PRICING;
    }
}

export async function savePricingConfig(config: PricingConfig): Promise<PricingConfig> {
    try {
        const { error } = await supabaseAdmin
            .from('pricing_config')
            .upsert({
                id: 1,
                labor_rate_per_sqft: config.laborRatePerSqft,
                waste_percentage: config.wastePercentage,
                owner_phone: config.ownerPhone,
                owner_whatsapp: config.ownerWhatsapp,
                require_lead_capture: config.requireLeadCapture,
            });

        if (error) throw error;
        return config;
    } catch (error) {
        console.error('Error saving pricing config to Supabase:', error);
        throw error;
    }
}

// ─── Delivery Zones ─────────────────────────────────────────

export async function getDeliveryZones(): Promise<DeliveryZone[]> {
    try {
        const { data, error } = await supabaseAdmin
            .from('delivery_zones')
            .select('*')
            .eq('active', true)
            .order('sort_order', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            return DEFAULT_DELIVERY_ZONES;
        }

        return data as DeliveryZone[];
    } catch (error) {
        console.error('Error reading delivery zones from Supabase:', error);
        return DEFAULT_DELIVERY_ZONES;
    }
}

export async function getAllDeliveryZones(): Promise<DeliveryZone[]> {
    try {
        const { data, error } = await supabaseAdmin
            .from('delivery_zones')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            return DEFAULT_DELIVERY_ZONES;
        }

        return data as DeliveryZone[];
    } catch (error) {
        console.error('Error reading delivery zones from Supabase:', error);
        return DEFAULT_DELIVERY_ZONES;
    }
}

export async function saveDeliveryZone(zone: Partial<DeliveryZone> & { name: string; label: string; fee: number }): Promise<DeliveryZone[]> {
    try {
        const { error } = await supabaseAdmin
            .from('delivery_zones')
            .upsert({
                id: zone.id || undefined,
                name: zone.name,
                label: zone.label,
                fee: zone.fee,
                radius_description: zone.radius_description || null,
                sort_order: zone.sort_order ?? 99,
                active: zone.active ?? true,
            });

        if (error) throw error;
        return getAllDeliveryZones();
    } catch (error) {
        console.error('Error saving delivery zone to Supabase:', error);
        throw error;
    }
}

export async function deleteDeliveryZone(id: string): Promise<DeliveryZone[]> {
    try {
        const { error } = await supabaseAdmin
            .from('delivery_zones')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return getAllDeliveryZones();
    } catch (error) {
        console.error('Error deleting delivery zone from Supabase:', error);
        throw error;
    }
}

// ─── Leads ──────────────────────────────────────────────────

export interface Lead {
    id: string;
    name: string;
    email: string;
    phone?: string;
    session_id?: string;
    source: string;
    status: 'new' | 'contacted' | 'converted';
    created_at: string;
}

export async function getLeads(filters?: { source?: string; status?: string; limit?: number }): Promise<Lead[]> {
    try {
        let query = supabaseAdmin
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (filters?.source) query = query.eq('source', filters.source);
        if (filters?.status) query = query.eq('status', filters.status);
        query = query.limit(filters?.limit || 100);

        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as Lead[];
    } catch (error) {
        console.error('Error reading leads from Supabase:', error);
        return [];
    }
}

export async function saveLead(lead: { name: string; email: string; phone?: string; session_id?: string; source: string }): Promise<Lead> {
    try {
        const { data, error } = await supabaseAdmin
            .from('leads')
            .insert({
                name: lead.name,
                email: lead.email,
                phone: lead.phone || null,
                session_id: lead.session_id || null,
                source: lead.source,
                status: 'new',
            })
            .select()
            .single();

        if (error) throw error;
        return data as Lead;
    } catch (error) {
        console.error('Error saving lead to Supabase:', error);
        throw error;
    }
}

export async function updateLeadStatus(id: string, status: string): Promise<void> {
    try {
        const { error } = await supabaseAdmin
            .from('leads')
            .update({ status })
            .eq('id', id);

        if (error) throw error;
    } catch (error) {
        console.error('Error updating lead status:', error);
        throw error;
    }
}

// ─── Analytics ──────────────────────────────────────────────

export async function insertAnalyticsEvent(event: {
    session_id: string;
    event_type: string;
    event_data?: any;
    step?: string | null;
}): Promise<void> {
    try {
        const { error } = await supabaseAdmin
            .from('analytics_events')
            .insert({
                session_id: event.session_id,
                event_type: event.event_type,
                event_data: event.event_data || {},
                step: event.step || null,
            });

        if (error) throw error;
    } catch (error) {
        console.error('Error inserting analytics event:', error);
    }
}

export async function getAnalyticsOverview(daysBack: number = 30): Promise<{
    totalSessions: number;
    totalLeads: number;
    funnel: Record<string, number>;
    recentLeads: Lead[];
    popularProducts: Array<{ name: string; count: number }>;
    simulationStats: { success: number; failed: number };
    ctaClicks: Record<string, number>;
}> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startStr = startDate.toISOString();

    try {
        // Get all events in period
        const { data: events, error } = await supabaseAdmin
            .from('analytics_events')
            .select('session_id, event_type, event_data, step')
            .gte('created_at', startStr);

        if (error) throw error;

        const allEvents = events || [];

        // Total unique sessions
        const sessions = new Set(allEvents.map(e => e.session_id));
        const totalSessions = sessions.size;

        // Funnel: count unique sessions per step
        const stepEvents = allEvents.filter(e => e.event_type === 'step_entered');
        const funnel: Record<string, number> = {};
        for (const e of stepEvents) {
            if (e.step) {
                if (!funnel[e.step]) funnel[e.step] = 0;
                funnel[e.step]++;
            }
        }

        // Simulation stats
        const simSuccess = allEvents.filter(e => e.event_type === 'simulation_generated').length;
        const simFailed = allEvents.filter(e => e.event_type === 'simulation_failed').length;

        // CTA clicks
        const ctaEvents = allEvents.filter(e => e.event_type === 'cta_clicked');
        const ctaClicks: Record<string, number> = {};
        for (const e of ctaEvents) {
            const type = e.event_data?.type || 'unknown';
            ctaClicks[type] = (ctaClicks[type] || 0) + 1;
        }

        // Popular products
        const productEvents = allEvents.filter(e => e.event_type === 'product_selected');
        const productCounts: Record<string, number> = {};
        for (const e of productEvents) {
            const name = e.event_data?.product || 'Unknown';
            productCounts[name] = (productCounts[name] || 0) + 1;
        }
        const popularProducts = Object.entries(productCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Recent leads
        const recentLeads = await getLeads({ limit: 10 });

        // Total leads
        const { count: totalLeads } = await supabaseAdmin
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startStr);

        return {
            totalSessions,
            totalLeads: totalLeads || 0,
            funnel,
            recentLeads,
            popularProducts,
            simulationStats: { success: simSuccess, failed: simFailed },
            ctaClicks,
        };
    } catch (error) {
        console.error('Error getting analytics overview:', error);
        return {
            totalSessions: 0,
            totalLeads: 0,
            funnel: {},
            recentLeads: [],
            popularProducts: [],
            simulationStats: { success: 0, failed: 0 },
            ctaClicks: {},
        };
    }
}
