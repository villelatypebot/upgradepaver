
"use client";

import { useEffect, useState } from "react";
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { cn } from "@/lib/utils";
import { loadImageDimensions } from "@/lib/simulation-client";

interface ComparisonSliderProps {
    original: string;
    generated: string;
    className?: string;
}

interface PreparedComparisonImages {
    aspectRatio: number;
    key: string;
    generated: string;
}

function loadImageElement(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();

        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Failed to load comparison image."));
        image.src = src;
    });
}

function renderGeneratedToOriginalFrame(
    image: HTMLImageElement,
    targetWidth: number,
    targetHeight: number
) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
        return image.src;
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    const sourceAspectRatio = sourceWidth / sourceHeight;
    const targetAspectRatio = targetWidth / targetHeight;
    const aspectDelta = Math.abs(sourceAspectRatio - targetAspectRatio);

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    if (aspectDelta <= 0.02) {
        const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
        const drawWidth = sourceWidth * scale;
        const drawHeight = sourceHeight * scale;
        const offsetX = (targetWidth - drawWidth) / 2;
        const offsetY = (targetHeight - drawHeight) / 2;

        context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    } else {
        context.drawImage(image, 0, 0, targetWidth, targetHeight);
    }

    return canvas.toDataURL("image/png");
}

export function ComparisonSlider({ original, generated, className }: ComparisonSliderProps) {
    const [aspectRatio, setAspectRatio] = useState(4 / 3);
    const [preparedImages, setPreparedImages] = useState<PreparedComparisonImages | null>(null);
    const comparisonKey = `${original}::${generated}`;

    useEffect(() => {
        let isCancelled = false;

        async function prepareComparison() {
            try {
                const [originalDimensions, generatedImage] = await Promise.all([
                    loadImageDimensions(original),
                    loadImageElement(generated),
                ]);

                if (isCancelled) {
                    return;
                }

                setAspectRatio(originalDimensions.width / originalDimensions.height);
                setPreparedImages({
                    aspectRatio: originalDimensions.width / originalDimensions.height,
                    key: comparisonKey,
                    generated: renderGeneratedToOriginalFrame(
                        generatedImage,
                        originalDimensions.width,
                        originalDimensions.height
                    ),
                });
            } catch {
                if (!isCancelled) {
                    setPreparedImages(null);
                }
            }
        }

        prepareComparison();

        return () => {
            isCancelled = true;
        };
    }, [comparisonKey, original, generated]);

    const isPreparedForCurrentImages = preparedImages?.key === comparisonKey;
    const normalizedGenerated = isPreparedForCurrentImages ? preparedImages.generated : generated;

    return (
        <div
            className={cn("w-full rounded-xl overflow-hidden shadow-2xl bg-slate-950/5", className)}
            style={{ aspectRatio: `${isPreparedForCurrentImages ? preparedImages.aspectRatio : aspectRatio}` }}
        >
            {isPreparedForCurrentImages ? (
                <ReactCompareSlider
                    itemOne={
                        <ReactCompareSliderImage
                            src={original}
                            alt="Original"
                            style={{ width: "100%", height: "100%", objectFit: "fill" }}
                        />
                    }
                    itemTwo={
                        <ReactCompareSliderImage
                            src={normalizedGenerated}
                            alt="Generated"
                            style={{ width: "100%", height: "100%", objectFit: "fill" }}
                        />
                    }
                    className="h-full w-full"
                />
            ) : (
                <div className="h-full w-full animate-pulse bg-slate-200/70" />
            )}
        </div>
    );
}
