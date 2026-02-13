"use client";

import { cn } from "@/lib/utils";

interface ProgressStep {
    id: string;
    label: string;
}

interface ProgressBarProps {
    steps: ProgressStep[];
    currentStepId: string;
    completedSteps: Set<string>;
}

const STEP_ORDER: Record<string, number> = {
    welcome: 0,
    photos: 1,
    measurements: 2,
    "lead-capture": 3,
    "photo-product": 4,
    "photo-simulation": 5,
    "material-quote": 6,
    "labor-quote": 7,
};

export function ProgressBar({ steps, currentStepId, completedSteps }: ProgressBarProps) {
    const currentIndex = STEP_ORDER[currentStepId] ?? 0;

    return (
        <div className="px-4 py-2 border-b bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-1 max-w-2xl mx-auto">
                {steps.map((step, i) => {
                    const stepIndex = STEP_ORDER[step.id] ?? i;
                    const isCompleted = completedSteps.has(step.id) || stepIndex < currentIndex;
                    const isCurrent = step.id === currentStepId ||
                        (currentStepId === "photo-simulation" && step.id === "photo-product");
                    const isPending = !isCompleted && !isCurrent;

                    return (
                        <div key={step.id} className="flex-1 flex flex-col items-center gap-1">
                            <div
                                className={cn(
                                    "w-full h-1.5 rounded-full transition-all duration-500",
                                    isCompleted ? "bg-primary" :
                                    isCurrent ? "bg-primary/50" :
                                    "bg-muted"
                                )}
                            />
                            <span
                                className={cn(
                                    "text-[9px] font-medium transition-colors hidden sm:block",
                                    isCompleted ? "text-primary" :
                                    isCurrent ? "text-foreground" :
                                    "text-muted-foreground/50"
                                )}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
            <p className="text-center text-[10px] text-muted-foreground mt-1 sm:hidden">
                Step {Math.min(currentIndex + 1, steps.length)} of {steps.length}
            </p>
        </div>
    );
}
