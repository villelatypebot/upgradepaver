import { NextResponse } from 'next/server';
import { getDeliveryZones, getAllDeliveryZones, saveDeliveryZone, deleteDeliveryZone } from '@/lib/db-storage';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const all = searchParams.get('all') === 'true';
        const zones = all ? await getAllDeliveryZones() : await getDeliveryZones();
        return NextResponse.json(zones);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        if (!body.name || !body.label || body.fee === undefined) {
            return NextResponse.json({ error: 'Name, label, and fee are required' }, { status: 400 });
        }
        const zones = await saveDeliveryZone(body);
        return NextResponse.json(zones);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const body = await req.json();
        if (!body.id) {
            return NextResponse.json({ error: 'Zone ID is required' }, { status: 400 });
        }
        const zones = await deleteDeliveryZone(body.id);
        return NextResponse.json(zones);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
