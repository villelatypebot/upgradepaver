import { NextResponse } from 'next/server';
import { getConfig, addLog } from '@/lib/server-config';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Fetch webhook URL from config
        const config = await getConfig();
        const webhookUrl = config.webhookUrl;

        if (!webhookUrl) {
            console.error('Webhook URL is not configured.');
            await addLog({
                action: 'Webhook Trigger Failed',
                details: 'Webhook URL is not configured in Admin Settings.',
                status: 'error'
            });
            return NextResponse.json({ error: 'Webhook URL not configured. Contact admin.' }, { status: 400 });
        }

        // Send data to webhook
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...body,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            console.error('Webhook failed with status:', response.status);
            await addLog({
                action: 'Webhook Delivery Failed',
                details: `Status ${response.status}`,
                status: 'error'
            });
            return NextResponse.json({ error: 'Failed to deliver webhook' }, { status: 500 });
        }

        await addLog({
            action: 'Webhook Delivered Successfully',
            details: `Sent to ${webhookUrl}`,
            status: 'success'
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error triggering webhook:', error);
        await addLog({
            action: 'Webhook Trigger Exception',
            details: error.message,
            status: 'error'
        });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
