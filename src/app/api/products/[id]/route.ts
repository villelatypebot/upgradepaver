
import { NextResponse } from 'next/server';
import { deleteStoredProduct } from '@/lib/db-storage';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;
        const updatedProducts = await deleteStoredProduct(id);
        return NextResponse.json(updatedProducts);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
}
