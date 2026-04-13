
"use client";

import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { cn } from "@/lib/utils";

interface ComparisonSliderProps {
    original: string;
    generated: string;
    className?: string;
}

export function ComparisonSlider({ original, generated, className }: ComparisonSliderProps) {
    return (
        <div className={cn("w-full h-full rounded-xl overflow-hidden shadow-2xl bg-slate-950/5", className)}>
            <ReactCompareSlider
                itemOne={
                    <ReactCompareSliderImage
                        src={original}
                        alt="Original"
                        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
                    />
                }
                itemTwo={
                    <ReactCompareSliderImage
                        src={generated}
                        alt="Generated"
                        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
                    />
                }
                className="h-full w-full"
            />
        </div>
    );
}
