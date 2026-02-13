
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DATA_DIR = path.join(process.cwd(), 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const LOGS_FILE = path.join(DATA_DIR, 'activity.json');

async function migrate() {
    console.log('Starting migration to Supabase...');

    // 1. Migrate Products
    if (fs.existsSync(PRODUCTS_FILE)) {
        console.log('Migrating products...');
        const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
        const { error } = await supabase.from('products').upsert(products);
        if (error) console.error('Error migrating products:', error);
        else console.log(`Migrated ${products.length} products.`);
    }

    // 2. Migrate Config
    if (fs.existsSync(CONFIG_FILE)) {
        console.log('Migrating config...');
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
        const { error } = await supabase.from('config').upsert({ id: 1, ...config });
        if (error) console.error('Error migrating config:', error);
        else console.log('Migrated config.');
    }

    // 3. Migrate Logs
    if (fs.existsSync(LOGS_FILE)) {
        console.log('Migrating logs...');
        const logs = JSON.parse(fs.readFileSync(LOGS_FILE, 'utf-8'));
        // Logs are historical, we can just insert them
        const formattedLogs = logs.map((l: any) => ({
            action: l.action,
            details: l.details,
            status: l.status,
            timestamp: l.timestamp
        }));
        const { error } = await supabase.from('activity_logs').insert(formattedLogs);
        if (error) console.error('Error migrating logs:', error);
        else console.log(`Migrated ${logs.length} logs.`);
    }

    console.log('Migration finished!');
}

migrate();
