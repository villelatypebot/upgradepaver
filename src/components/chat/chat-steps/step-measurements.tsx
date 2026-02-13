"use client";

import { useState } from "react";
import { ChatMessage } from "../chat-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Ruler } from "lucide-react";

interface StepMeasurementsProps {
    width: number;
    length: number;
    onMeasurementsChange: (width: number, length: number) => void;
    onContinue: () => void;
    answered: boolean;
}

export function StepMeasurements({ width, length, onMeasurementsChange, onContinue, answered }: StepMeasurementsProps) {
    const totalSqft = width * length;

    if (answered) {
        return (
            <>
                <ChatMessage type="bot">
                    What are the measurements of the area? Enter the width and length in feet.
                </ChatMessage>
                <ChatMessage type="user">
                    {width} ft x {length} ft = {totalSqft} sq ft
                </ChatMessage>
            </>
        );
    }

    return (
        <>
            <ChatMessage type="bot">
                <p>What are the measurements of the area?</p>
                <p className="text-muted-foreground mt-1">Enter the width and length in feet.</p>
            </ChatMessage>
            <div className="mt-3 space-y-4 px-2">
                <div className="bg-white border rounded-xl p-4 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Ruler className="w-4 h-4 text-primary" />
                        Area Measurements
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Width (ft)</label>
                            <Input
                                type="number"
                                min={1}
                                placeholder="e.g. 20"
                                value={width || ""}
                                onChange={(e) => onMeasurementsChange(Number(e.target.value), length)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Length (ft)</label>
                            <Input
                                type="number"
                                min={1}
                                placeholder="e.g. 25"
                                value={length || ""}
                                onChange={(e) => onMeasurementsChange(width, Number(e.target.value))}
                            />
                        </div>
                    </div>
                    {totalSqft > 0 && (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 text-center">
                            <span className="text-sm text-muted-foreground">Total area: </span>
                            <span className="font-bold text-primary text-lg">{totalSqft} sq ft</span>
                        </div>
                    )}
                </div>
                {totalSqft > 0 && (
                    <div className="flex justify-center">
                        <Button onClick={onContinue} className="px-6">
                            Continue <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}
