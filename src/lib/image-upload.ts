"use client";

export const MAX_UPLOAD_FILE_MB = 20;
export const MAX_UPLOAD_FILE_BYTES = MAX_UPLOAD_FILE_MB * 1024 * 1024;
export const MAX_ANALYSIS_IMAGE_BYTES = 2.4 * 1024 * 1024;
export const MAX_ANALYSIS_IMAGE_DIMENSION = 2200;

export interface PreparedImageResult {
    dataUrl: string;
    originalSizeBytes: number;
    preparedSizeBytes: number;
    wasOptimized: boolean;
}

function readFileAsDataUrl(file: Blob) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve((reader.result as string) || "");
        reader.onerror = () => reject(new Error("Failed to read the selected image."));
        reader.readAsDataURL(file);
    });
}

function loadImageFromUrl(url: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();

        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Failed to load the selected image."));
        image.src = url;
    });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error("Failed to optimize the selected image."));
                    return;
                }

                resolve(blob);
            },
            "image/jpeg",
            quality,
        );
    });
}

function getScaledDimensions(width: number, height: number, maxDimension: number) {
    const longestSide = Math.max(width, height);

    if (longestSide <= maxDimension) {
        return { width, height };
    }

    const scale = maxDimension / longestSide;

    return {
        width: Math.max(1, Math.round(width * scale)),
        height: Math.max(1, Math.round(height * scale)),
    };
}

export async function prepareImageForAnalysis(file: File): Promise<PreparedImageResult> {
    if (!file.type.startsWith("image/")) {
        throw new Error("Please upload a valid image file.");
    }

    if (file.size > MAX_UPLOAD_FILE_BYTES) {
        throw new Error(`Please upload an image up to ${MAX_UPLOAD_FILE_MB} MB.`);
    }

    const objectUrl = URL.createObjectURL(file);

    try {
        const image = await loadImageFromUrl(objectUrl);
        let targetDimensions = getScaledDimensions(
            image.naturalWidth || image.width,
            image.naturalHeight || image.height,
            MAX_ANALYSIS_IMAGE_DIMENSION,
        );

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
            throw new Error("Your browser could not prepare the image.");
        }

        const qualitySteps = [0.92, 0.86, 0.8, 0.74, 0.68, 0.62, 0.56];
        let bestBlob: Blob | null = null;

        for (let resizePass = 0; resizePass < 4; resizePass += 1) {
            canvas.width = targetDimensions.width;
            canvas.height = targetDimensions.height;

            context.clearRect(0, 0, canvas.width, canvas.height);
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = "high";
            context.drawImage(image, 0, 0, canvas.width, canvas.height);

            for (const quality of qualitySteps) {
                const blob = await canvasToBlob(canvas, quality);

                bestBlob = blob;

                if (blob.size <= MAX_ANALYSIS_IMAGE_BYTES) {
                    const dataUrl = await readFileAsDataUrl(blob);

                    return {
                        dataUrl,
                        originalSizeBytes: file.size,
                        preparedSizeBytes: blob.size,
                        wasOptimized: blob.size !== file.size
                            || canvas.width !== (image.naturalWidth || image.width)
                            || canvas.height !== (image.naturalHeight || image.height),
                    };
                }
            }

            targetDimensions = {
                width: Math.max(1, Math.round(targetDimensions.width * 0.88)),
                height: Math.max(1, Math.round(targetDimensions.height * 0.88)),
            };
        }

        if (!bestBlob) {
            throw new Error("Failed to optimize the selected image.");
        }

        const dataUrl = await readFileAsDataUrl(bestBlob);

        return {
            dataUrl,
            originalSizeBytes: file.size,
            preparedSizeBytes: bestBlob.size,
            wasOptimized: true,
        };
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}
