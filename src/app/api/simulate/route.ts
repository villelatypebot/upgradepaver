import { NextResponse } from 'next/server';
import { getConfig, addLog } from '@/lib/server-config';
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60; // Allow up to 60 seconds for processing

export async function POST(req: Request) {
    const startTime = Date.now();
    let paverStyleLog = 'Unknown';

    try {
        const { originalImage, paverStyle, paverTexture, customPrompt } = await req.json();
        paverStyleLog = paverStyle || 'Unknown';

        if (!originalImage || !paverStyle || !paverTexture) {
            throw new Error('Missing required fields');
        }

        // Try config first, then env
        const config = await getConfig();
        const GOOGLE_AI_API_KEY = config.googleAiApiKey || process.env.GOOGLE_AI_API_KEY;

        if (!GOOGLE_AI_API_KEY) {
            throw new Error('GOOGLE_AI_API_KEY is not configured');
        }

        // Initialize SDK
        const ai = new GoogleGenAI({ apiKey: GOOGLE_AI_API_KEY });

        // Extract base64 from data URL
        const base64Image = originalImage.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

        // Fetch texture and convert to base64
        const textureBuffer = await (await fetch(paverTexture)).arrayBuffer();
        const textureBase64 = Buffer.from(textureBuffer).toString('base64');


        const prompt = customPrompt || `
Transforme esta imagem aplicando o pavimento ${paverStyle} no chão / piso da área externa.
    INSTRUÇÕES:
- Substitua APENAS a superfície do chão / piso com o padrão de pavimento ${paverStyle} mostrado na textura de referência.
- Mantenha EXATAMENTE a mesma perspectiva, iluminação e sombras realistas da cena original.
- NÃO altere nenhum outro elementos (móveis, paredes, plantas, piscinas, estruturas).
- Faça a instalação dos pavers parecer profissional e natural.
- Os pavers devem seguir perfeitamente os contornos e ângulos do chão existente.
- Mantenha sombras e reflexos naturais.

IMPORTANTE: GERE UMA IMAGEM. NÃO RETORNE APENAS TEXTO DESCREVENDO A IMAGEM.
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: [
                {
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: "image/jpeg",
                                data: base64Image,
                            },
                        },
                        {
                            inlineData: {
                                mimeType: "image/jpeg",
                                data: textureBase64,
                            },
                        },
                    ],
                },
            ],
        });

        console.log("Full Gemini Response:", JSON.stringify(response, null, 2));

        const candidate = response.candidates?.[0];
        const parts = candidate?.content?.parts || [];

        // Find the part that contains the image
        let imagePart = parts.find(p => p.inlineData);
        let generatedImage: string | undefined;

        if (imagePart?.inlineData) {
            const generatedMime = imagePart.inlineData.mimeType;
            const generatedImageData = imagePart.inlineData.data;
            generatedImage = `data:${generatedMime};base64,${generatedImageData}`;
        } else {
            // Fallback: Check if the text contains a markdown image or base64 data
            const textPart = parts.find(p => p.text);
            const text = textPart?.text || '';

            // Regex for explicit markdown image with data URL or just a raw data URL
            const base64Match = text.match(/data:image\/(?:png|jpeg|jpg|webp);base64,([a-zA-Z0-9+/=]+)/);

            if (base64Match) {
                console.log("Found base64 image in text response");
                generatedImage = base64Match[0]; // The whole match is the data URL
            } else {
                console.warn("No inlineData or base64 text found. Sections:", parts.map(p => Object.keys(p)));
                if (text) {
                    console.warn("Text content received:", text);
                }
                throw new Error(`API returned text/no-image. Text excerpt: ${text.substring(0, 100)}... (Check server logs for full response)`);
            }
        }

        await addLog({
            action: 'generate_simulation',
            status: 'success',
            details: {
                paver: paverStyleLog,
                durationMs: Date.now() - startTime
            }
        });

        return NextResponse.json({ generatedImage });

    } catch (error: any) {
        console.error('Simulation error:', error);

        await addLog({
            action: 'generate_simulation',
            status: 'error',
            details: {
                paver: paverStyleLog,
                error: error.message || 'Unknown error',
                durationMs: Date.now() - startTime
            }
        });

        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
