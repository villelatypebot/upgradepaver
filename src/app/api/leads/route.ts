import { NextResponse } from 'next/server';
import { deleteLead, getLeads, saveLead, updateLeadStatus } from '@/lib/db-storage';

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Internal server error';
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const source = searchParams.get('source') || undefined;
        const status = searchParams.get('status') || undefined;
        const limit = parseInt(searchParams.get('limit') || '100');
        const leads = await getLeads({ source, status, limit });
        return NextResponse.json(leads);
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        if (!body.name || !body.email) {
            return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
        }
        const lead = await saveLead(body);
        return NextResponse.json(lead);
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        if (!body.id || !body.status) {
            return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
        }
        await updateLeadStatus(body.id, body.status);
        return NextResponse.json({ ok: true });
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const body = await req.json();
        if (!body.id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }
        await deleteLead(body.id);
        return NextResponse.json({ ok: true });
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
