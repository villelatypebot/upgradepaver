
"use client";

import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

interface ComparisonSliderProps {
    original: string;
    generated: string;
    className?: string;
}

export function ComparisonSlider({ original, generated, className }: ComparisonSliderProps) {
    return (
        <div className={`w-full h-full rounded-xl overflow-hidden shadow-2xl ${className}`}>
            <ReactCompareSlider
                itemOne={<ReactCompareSliderImage src={original} alt="Original" />}
                itemTwo={<ReactCompareSliderImage src={generated} alt="Generated" />}
                className="h-full w-full object-cover"
            />
        </div>
    );
}
