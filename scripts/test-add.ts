
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function testAndAdd() {
    console.log('Verifying data in Supabase...');

    // 1. Check existing products
    const { data: products } = await supabase.from('products').select('*');
    console.log(`Current products in DB: ${products?.length || 0}`);

    // 2. Add the new product
    const newProduct = {
        id: 'lenza-block-wall',
        name: 'Lenza Block - Retaining Wall',
        description: 'Clean. Versatile. Linear.\n\nThe Lenza Wall is the newest wall innovation from Tremron. Perfect for decorative walls, fire pits or outdoor grill stations, the clean lines of the Lenza Wall will be a showstopper. Wall system can be glued or pinned and is complimented by a matching cap.',
        manufacturerId: 'tremron', // Assuming this manufacturer exists or using a handle
        prompt: "Transforme esta imagem aplicando o revestimento {productName} nas paredes verticais ou fachadas visíveis.\n    INSTRUÇÕES:\n- Substitua APENAS as superfícies verticais de parede / fachada com o revestimento {productName} mostrado na textura de referência.\n- Mantenha EXATAMENTE a mesma perspectiva, iluminação e sombras realistas da cena original.\n- NÃO altere o chão, móveis, plantas ou outros elementos.\n- Faça a instalação parecer profissional e natural.\n- Mantenha sombras e reflexos naturais.\n\nO resultado deve parecer uma visualização arquitetônica profissional com o revestimento {productName} instalado.",
        variants: [
            {
                id: 'lenza-glacier',
                name: 'Glacier',
                textureUrl: 'https://directpavers.com/cdn/shop/files/lenza-glacier.jpg',
                exampleUrl: 'https://directpavers.com/cdn/shop/files/lenza-slider-sierra.jpg'
            }
        ]
    };

    console.log('Adding new product...');
    const { error } = await supabase.from('products').upsert(newProduct);

    if (error) {
        console.error('Error adding product:', error);
    } else {
        console.log('Product "Lenza Block" added successfully!');
    }
}

testAndAdd();
