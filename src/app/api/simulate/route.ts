import { NextResponse } from 'next/server';
import { getConfig, addLog } from '@/lib/server-config';
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60; // Allow up to 60 seconds for processing

const SUPPORTED_ASPECT_RATIOS = [
    "1:1",
    "2:3",
    "3:2",
    "3:4",
    "4:3",
    "4:5",
    "5:4",
    "9:16",
    "16:9",
    "21:9",
] as const;

const IMAGE_MODELS = [
    "gemini-3.1-flash-image",
    "gemini-3.1-flash-lite-image",
    "gemini-2.5-flash-image",
] as const;

function getClosestAspectRatio(width?: number, height?: number) {
    if (!width || !height) {
        return undefined;
    }

    const targetRatio = width / height;

    return SUPPORTED_ASPECT_RATIOS
        .map((aspectRatio) => {
            const [w, h] = aspectRatio.split(":").map(Number);

            return {
                aspectRatio,
                delta: Math.abs(targetRatio - (w / h)),
            };
        })
        .sort((left, right) => left.delta - right.delta)[0]?.aspectRatio;
}

function buildSimulationPrompt({
    paverStyle,
    customPrompt,
    userNotes,
}: {
    paverStyle: string;
    customPrompt?: string;
    userNotes?: string;
}) {
    const sections = [
        `Edit this real customer photo by installing ${paverStyle} in the patio project area.`,
        [
            "CORE EDIT RULES:",
            `- Replace the visible patio, walkway, driveway, slab, or outdoor floor area with ${paverStyle}.`,
            "- If the project area includes grass, lawn, bare soil, gravel, or worn ground that clearly belongs to the patio install zone, convert those surfaces to the selected pavers too.",
            "- Respect any exclusions or special instructions from the customer notes.",
            "- Respect all boundaries, perspective lines, drainage slope, lighting, shadows, and camera framing from the original photo.",
            "- Keep the exact same crop, aspect ratio, and point of view so the before/after aligns perfectly.",
            "- Do not modify walls, doors, windows, roofs, furniture, shrubs, flower beds, trees, pools, people, or vehicles unless the customer notes explicitly ask for it.",
            "- Do not invent new landscaping or architecture.",
            "- The result must look photorealistic and professionally installed.",
        ].join("\n"),
    ];

    if (customPrompt?.trim()) {
        sections.push(`PRODUCT-SPECIFIC GUIDANCE:\n${customPrompt.trim()}`);
    }

    if (userNotes?.trim()) {
        sections.push(`CUSTOMER NOTES (follow exactly):\n${userNotes.trim()}`);
    }

    sections.push("OUTPUT RULES:\n- Return only the edited image.\n- Do not return explanatory text.");

    return sections.join("\n\n");
}

function toFriendlySimulationError(error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (/Unexpected token|not a valid JSON|Cannot parse/i.test(message)) {
        return "The visualization service returned an unreadable response. Please try again.";
    }

    if (/Requests En|Too Many Requests|rate limit|quota|429/i.test(message)) {
        return "The visualization service is temporarily busy. Please wait a moment and try again.";
    }

    return message;
}

function shouldRetryWithAnotherModel(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    return /RESOURCE_EXHAUSTED|rate limit|quota|429|temporarily busy|overloaded|unavailable|503|Requests En/i.test(message);
}

function extractGeneratedImage(imageOutput: { data?: string; mime_type?: string } | undefined) {
    if (!imageOutput?.data) {
        return null;
    }

    return `data:${imageOutput.mime_type || "image/jpeg"};base64,${imageOutput.data}`;
}

export async function POST(req: Request) {
    const startTime = Date.now();
    let paverStyleLog = 'Unknown';
    let modelUsed: string = IMAGE_MODELS[0];

    try {
        const {
            originalImage,
            paverStyle,
            paverTexture,
            customPrompt,
            userNotes,
            originalWidth,
            originalHeight,
        } = await req.json();
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
        const originalMimeType = originalImage.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/)?.[1] || "image/jpeg";
        const base64Image = originalImage.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');

        // Fetch texture and convert to base64
        const textureResponse = await fetch(paverTexture);
        const textureBuffer = await textureResponse.arrayBuffer();
        const textureBase64 = Buffer.from(textureBuffer).toString('base64');
        const textureMimeType = textureResponse.headers.get("content-type")?.split(";")[0] || "image/jpeg";
        const prompt = buildSimulationPrompt({ paverStyle, customPrompt, userNotes });
        const aspectRatio = getClosestAspectRatio(originalWidth, originalHeight);
        let generatedImage: string | null = null;
        let lastError: unknown = null;

        for (const model of IMAGE_MODELS) {
            modelUsed = model;

            try {
                const interaction = await ai.interactions.create({
                    model,
                    input: [
                        { type: "text", text: prompt },
                        {
                            type: "image",
                            mime_type: originalMimeType,
                            data: base64Image,
                        },
                        {
                            type: "image",
                            mime_type: textureMimeType,
                            data: textureBase64,
                        },
                    ],
                    response_modalities: ["image"],
                    response_format: {
                        type: "image",
                        mime_type: "image/jpeg",
                        image_size: "1K",
                        ...(aspectRatio ? { aspect_ratio: aspectRatio } : {}),
                    },
                });

                generatedImage = extractGeneratedImage(interaction.output_image);

                if (generatedImage) {
                    break;
                }

                throw new Error("The visualization service returned text instead of an image.");
            } catch (error: unknown) {
                lastError = error;

                if (!shouldRetryWithAnotherModel(error) || model === IMAGE_MODELS[IMAGE_MODELS.length - 1]) {
                    throw error;
                }
            }
        }

        if (!generatedImage) {
            throw lastError instanceof Error
                ? lastError
                : new Error("The visualization service did not return an image.");
        }

        await addLog({
            action: 'generate_simulation',
            status: 'success',
            details: {
                paver: paverStyleLog,
                model: modelUsed,
                durationMs: Date.now() - startTime
            }
        });

        return NextResponse.json({ generatedImage });

    } catch (error: unknown) {
        const friendlyError = toFriendlySimulationError(error);

        console.error('Simulation error:', error);

        await addLog({
            action: 'generate_simulation',
            status: 'error',
            details: {
                paver: paverStyleLog,
                model: modelUsed,
                error: friendlyError,
                durationMs: Date.now() - startTime
            }
        });

        return NextResponse.json(
            { error: friendlyError || 'Internal server error' },
            { status: 500 }
        );
    }
}
