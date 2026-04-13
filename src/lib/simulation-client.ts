"use client";

export interface SimulationRequestPayload {
    originalImage: string;
    paverStyle: string;
    paverTexture: string;
    customPrompt?: string;
    userNotes?: string;
}

export interface ImageDimensions {
    width: number;
    height: number;
}

interface SimulationApiResponse {
    generatedImage?: string;
    error?: string;
}

function loadImageElement(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();

        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Failed to load image."));
        image.src = src;
    });
}

export async function loadImageDimensions(src: string): Promise<ImageDimensions> {
    const image = await loadImageElement(src);

    return {
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
    };
}

function normalizeSimulationError(rawMessage: string) {
    const message = rawMessage.trim();

    if (!message) {
        return "The visualization service did not return a response. Please try again.";
    }

    if (/Unexpected token|not a valid JSON|Cannot parse/i.test(message)) {
        return "The visualization service returned an unreadable response. Please try again.";
    }

    if (message.startsWith("<") || /<!DOCTYPE|<html/i.test(message) || message.length > 280) {
        return "The visualization service returned an unreadable response. Please try again.";
    }

    if (/Requests En|Too Many Requests|rate limit|quota|429/i.test(message)) {
        return "The visualization service is temporarily busy. Please wait a moment and try again.";
    }

    return message.replace(/\s+/g, " ");
}

async function readSimulationResponse(response: Response) {
    const rawBody = await response.text();

    if (!rawBody.trim()) {
        return {} as SimulationApiResponse;
    }

    try {
        return JSON.parse(rawBody) as SimulationApiResponse;
    } catch {
        throw new Error(normalizeSimulationError(rawBody));
    }
}

export async function requestSimulation(payload: SimulationRequestPayload) {
    let originalDimensions: ImageDimensions | null = null;

    try {
        originalDimensions = await loadImageDimensions(payload.originalImage);
    } catch {
        originalDimensions = null;
    }

    const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            ...payload,
            originalWidth: originalDimensions?.width,
            originalHeight: originalDimensions?.height,
        }),
    });

    const data = await readSimulationResponse(response);

    if (!response.ok) {
        throw new Error(normalizeSimulationError(data.error || "Failed to generate simulation."));
    }

    if (!data.generatedImage) {
        throw new Error("The visualization service did not return an image. Please try again.");
    }

    return data.generatedImage;
}
