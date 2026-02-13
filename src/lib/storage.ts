import { PaverProduct, INITIAL_PRODUCTS, ManufacturerId } from '@/config/pavers';

// API/Client-side wrapper for products

export const getProducts = async (): Promise<PaverProduct[]> => {
    try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
};

export const saveProduct = async (product: PaverProduct): Promise<PaverProduct[]> => {
    try {
        const res = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product),
        });
        if (!res.ok) throw new Error('Failed to save product');
        return res.json();
    } catch (error) {
        console.error('Error saving product:', error);
        throw error;
    }
};

export const deleteProduct = async (id: string): Promise<PaverProduct[]> => {
    try {
        const res = await fetch(`/api/products/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete product');
        return res.json();
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
};

export const getProductsByManufacturer = async (manufacturerId: ManufacturerId | 'all'): Promise<PaverProduct[]> => {
    const products = await getProducts();
    if (manufacturerId === 'all') return products;
    return products.filter(p => p.manufacturerId === manufacturerId);
};

