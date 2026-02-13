
import { NextResponse } from 'next/server';
import { getConfig, saveConfig, getLogs } from '@/lib/server-config';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (type === 'logs') {
        const logs = await getLogs();
        return NextResponse.json(logs);
    }

    const config = await getConfig();
    // Don't return the full key for security, maybe just a masked version or existence check?
    // For this admin panel, user wants to edit it, so we might need to return it if authenticated.
    // Assuming this route is protected or local.
    return NextResponse.json(config);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        if (body.googleAiApiKey) {
            await saveConfig({ googleAiApiKey: body.googleAiApiKey });
            return NextResponse.json({ success: true, message: 'API Key updated' });
        }
        return NextResponse.json({ error: 'Invalid config' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
    }
}
