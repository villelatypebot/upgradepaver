"use client";

import { useState } from "react";
import { ChatContainer } from "@/components/chat/chat-container";
import { ProgressBar } from "@/components/chat/progress-bar";
import { MessageCircle } from "lucide-react";

const STEP_META = [
    { id: "welcome", label: "Welcome" },
    { id: "photos", label: "Photos" },
    { id: "measurements", label: "Measurements" },
    { id: "lead-capture", label: "Contact" },
    { id: "photo-product", label: "Product" },
    { id: "photo-simulation", label: "Visualization" },
    { id: "material-quote", label: "Quote" },
    { id: "labor-quote", label: "Summary" },
];

export default function QuotePage() {
    const [currentStep, setCurrentStep] = useState("welcome");
    const [completedSteps] = useState<Set<string>>(new Set());

    return (
        <div className="min-h-[100dvh] flex flex-col font-sans bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-3 md:px-4 h-12 md:h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="relative w-7 h-7 md:w-8 md:h-8">
                            <img src="/logo.png" alt="DirectPavers Logo" className="object-contain w-full h-full" />
                        </div>
                        <div>
                            <span className="font-bold text-sm md:text-base tracking-tight text-foreground">Direct Pavers</span>
                            <span className="hidden sm:inline text-xs text-muted-foreground ml-2">Smart Quote</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MessageCircle className="w-4 h-4 text-primary" />
                        <span className="hidden sm:inline">Guided Quote</span>
                    </div>
                </div>
            </header>

            {/* Progress Bar */}
            <ProgressBar
                steps={STEP_META}
                currentStepId={currentStep}
                completedSteps={completedSteps}
            />

            {/* Chat Area */}
            <div className="flex-1 flex justify-center overflow-hidden">
                <div className="w-full max-w-2xl flex flex-col min-h-0">
                    <ChatContainer onStepChange={(step) => setCurrentStep(step)} />
                </div>
            </div>

            {/* Footer - hidden on mobile for more space */}
            <footer className="hidden sm:block border-t py-3 bg-muted/30">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-xs text-muted-foreground/50">
                        &copy; {new Date().getFullYear()} Direct Pavers. Factory prices, direct to you.
                    </p>
                </div>
            </footer>
        </div>
    );
}
