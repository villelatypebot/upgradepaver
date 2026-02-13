
import { supabaseAdmin } from './supabase';

interface ServerConfig {
    googleAiApiKey?: string;
}

interface ActivityLog {
    id: string;
    timestamp: string;
    action: string;
    details?: any;
    status: 'success' | 'error';
}

export async function getConfig(): Promise<ServerConfig> {
    try {
        const { data, error } = await supabaseAdmin
            .from('config')
            .select('*')
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows found"
        return data || {};
    } catch (error) {
        console.error('Error reading config from Supabase:', error);
        return {};
    }
}

export async function saveConfig(config: ServerConfig) {
    try {
        const current = await getConfig();
        const newConfig = { ...current, ...config };

        // We assume there's only one config row, or we use a specific ID if we want multi-tenant
        // For this app, a single row is fine.
        const { error } = await supabaseAdmin
            .from('config')
            .upsert({ id: 1, ...newConfig }); // Fixed ID for single config

        if (error) throw error;
        return newConfig;
    } catch (error) {
        console.error('Error saving config to Supabase:', error);
        throw error;
    }
}

export async function getLogs(): Promise<ActivityLog[]> {
    try {
        const { data, error } = await supabaseAdmin
            .from('activity_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(100);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error reading logs from Supabase:', error);
        return [];
    }
}

export async function addLog(entry: Omit<ActivityLog, 'id' | 'timestamp'>) {
    try {
        const { error } = await supabaseAdmin
            .from('activity_logs')
            .insert({
                action: entry.action,
                details: entry.details,
                status: entry.status
            });

        if (error) throw error;
    } catch (error) {
        console.error('Error adding log to Supabase:', error);
    }
}
