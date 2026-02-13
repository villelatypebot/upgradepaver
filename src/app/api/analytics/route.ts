import { NextResponse } from 'next/server';
import { insertAnalyticsEvent, getAnalyticsOverview } from '@/lib/db-storage';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        await insertAnalyticsEvent(body);
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const days = parseInt(searchParams.get('days') || '30');
        const overview = await getAnalyticsOverview(days);
        return NextResponse.json(overview);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
