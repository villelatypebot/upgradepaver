
import { NextResponse } from 'next/server';
import { getStoredProducts, saveStoredProduct } from '@/lib/db-storage';

export async function GET() {
    const products = await getStoredProducts();
    return NextResponse.json(products);
}

export async function POST(req: Request) {
    try {
        const product = await req.json();
        // Basic validation could go here
        if (!product.id || !product.name) {
            return NextResponse.json({ error: 'Invalid product data' }, { status: 400 });
        }

        const updatedProducts = await saveStoredProduct(product);
        return NextResponse.json(updatedProducts);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save product' }, { status: 500 });
    }
}
