"use client";

export interface SimulationRequestPayload {
    originalImage: string;
    paverStyle: string;
    paverTexture: string;
    customPrompt?: string;
    userNotes?: string;
}

interface SimulationApiResponse {
    generatedImage?: string;
    error?: string;
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
    const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
