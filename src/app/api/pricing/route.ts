import { NextResponse } from 'next/server';
import { getPricingConfig, savePricingConfig } from '@/lib/db-storage';

export async function GET() {
    try {
        const config = await getPricingConfig();
        return NextResponse.json(config);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to fetch pricing config' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const config = {
            laborRatePerSqft: Number(body.laborRatePerSqft),
            wastePercentage: Number(body.wastePercentage),
            ownerPhone: String(body.ownerPhone || ''),
            ownerWhatsapp: String(body.ownerWhatsapp || ''),
            requireLeadCapture: body.requireLeadCapture !== false,
        };
        const saved = await savePricingConfig(config);
        return NextResponse.json(saved);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to save pricing config' },
            { status: 500 }
        );
    }
}
