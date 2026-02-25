"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Smartphone, Ruler, Navigation2, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface HowToMeasureGuideProps {
    isOpen: boolean;
    onClose: () => void;
}

export function HowToMeasureGuide({ isOpen, onClose }: HowToMeasureGuideProps) {
    const [activeTab, setActiveTab] = useState<"phone" | "tape">("phone");
    const [step, setStep] = useState(0);

    // Auto-advance steps for animation
    useEffect(() => {
        if (!isOpen) return;
        const timer = setInterval(() => {
            setStep((prev) => (prev + 1) % 3);
        }, 3000);
        return () => clearInterval(timer);
    }, [isOpen, activeTab]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-4 bg-slate-900 text-white rounded-3xl p-1 relative shadow-2xl"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>

                    <div className="p-6">
                        <div className="mb-6">
                            <h3 className="text-xl font-semibold tracking-tight">How to measure</h3>
                            <p className="text-sm text-slate-400 mt-1">Select your preferred method</p>
                        </div>

                        {/* Tabs */}
                        <div className="flex bg-slate-800/50 p-1 rounded-2xl mb-8 relative">
                            {/* Animated Background pill */}
                            <motion.div
                                className="absolute inset-y-1 bg-primary rounded-xl"
                                initial={false}
                                animate={{
                                    left: activeTab === "phone" ? "4px" : "calc(50% + 2px)",
                                    width: "calc(50% - 6px)"
                                }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />

                            <button
                                onClick={() => { setActiveTab("phone"); setStep(0); }}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2.5 z-10 text-sm font-medium transition-colors rounded-xl",
                                    activeTab === "phone" ? "text-primary-foreground" : "text-slate-400 hover:text-white"
                                )}
                            >
                                <Smartphone className="w-4 h-4" />
                                Measuring App
                            </button>
                            <button
                                onClick={() => { setActiveTab("tape"); setStep(0); }}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2.5 z-10 text-sm font-medium transition-colors rounded-xl",
                                    activeTab === "tape" ? "text-primary-foreground" : "text-slate-400 hover:text-white"
                                )}
                            >
                                <Ruler className="w-4 h-4" />
                                Tape Measure
                            </button>
                        </div>

                        {/* Animation Area */}
                        <div className="relative h-[220px] bg-slate-800/50 rounded-2xl flex items-center justify-center overflow-hidden">
                            <AnimatePresence mode="wait">
                                {activeTab === "phone" ? (
                                    <PhoneAnimation key="phone" step={step} />
                                ) : (
                                    <TapeAnimation key="tape" step={step} />
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Pagination dots */}
                        <div className="flex justify-center gap-2 mt-6">
                            {[0, 1, 2].map((i) => (
                                <button
                                    key={i}
                                    onClick={() => setStep(i)}
                                    className="relative px-2 py-1"
                                >
                                    <span className={cn(
                                        "block w-2 h-2 rounded-full transition-all duration-300",
                                        step === i ? "bg-primary w-6" : "bg-slate-600 hover:bg-slate-500"
                                    )} />
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function PhoneAnimation({ step }: { step: number }) {
    const titles = [
        "Open measuring app",
        "Scan the floor",
        "Mark the corners"
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center w-full h-full p-6"
        >
            <div className="relative w-24 h-40 mb-6 flex items-center justify-center">
                {/* iPhone Outline */}
                <svg className="w-full h-full text-slate-300 drop-shadow-2xl" viewBox="0 0 100 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="5" y="5" width="90" height="190" rx="20" stroke="currentColor" strokeWidth="4" />
                    <rect x="35" y="15" width="30" height="6" rx="3" fill="currentColor" />

                    {/* Screen Content */}
                    <clipPath id="screen">
                        <rect x="9" y="9" width="82" height="182" rx="16" />
                    </clipPath>

                    <g clipPath="url(#screen)">
                        {/* Floor plane */}
                        <motion.path
                            d="M 10 120 L 90 120 L 110 200 L -10 200 Z"
                            fill="#1e293b"
                            animate={{
                                opacity: step === 0 ? 0 : 1,
                                d: step === 1 ? "M 10 120 L 90 120 L 110 200 L -10 200 Z" : "M 20 100 L 80 100 L 120 200 L -20 200 Z"
                            }}
                            transition={{ duration: 1, ease: "easeInOut", repeat: step === 1 ? Infinity : 0, repeatType: "reverse" }}
                        />

                        {/* Scanning Grid */}
                        <motion.g
                            initial={{ opacity: 0 }}
                            animate={{ opacity: step >= 1 ? 0.3 : 0 }}
                        >
                            <path d="M 0 140 L 100 140 M 0 160 L 100 160 M 0 180 L 100 180" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 4" />
                            <path d="M 30 120 L 10 200 M 50 120 L 50 200 M 70 120 L 90 200" stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 4" />
                        </motion.g>

                        {/* AR Dots and Lines */}
                        <motion.g
                            initial={{ opacity: 0 }}
                            animate={{ opacity: step === 2 ? 1 : 0 }}
                        >
                            <circle cx="20" cy="180" r="4" fill="#38bdf8" />
                            <circle cx="80" cy="180" r="4" fill="#38bdf8" />
                            <circle cx="60" cy="140" r="4" fill="#38bdf8" />
                            <motion.path
                                d="M 20 180 L 80 180 L 60 140 L 20 180"
                                stroke="#38bdf8"
                                strokeWidth="2"
                                fill="rgba(56, 189, 248, 0.2)"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: step === 2 ? 1 : 0 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                            {/* Area text floating */}
                            <text x="50" y="165" fill="white" fontSize="8" fontWeight="bold" textAnchor="middle">Measurement</text>
                        </motion.g>

                        {/* Scanner center reticle */}
                        <motion.g
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: step >= 1 ? 1 : 0, opacity: step >= 1 ? 1 : 0 }}
                            transition={{ type: "spring" }}
                        >
                            <circle cx="50" cy="100" r="10" stroke="#fff" strokeWidth="2" fill="none" opacity="0.5" />
                            <circle cx="50" cy="100" r="2" fill="#fff" />
                        </motion.g>
                    </g>
                </svg>

                {/* Animated hand interacting */}
                {step === 2 && (
                    <motion.div
                        className="absolute w-8 h-8 rounded-full bg-white/20 blur-xl top-1/2 left-1/2"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    />
                )}
            </div>

            <motion.p
                key={titles[step]}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center font-medium font-sm text-slate-200"
            >
                {titles[step]}
            </motion.p>
        </motion.div>
    );
}

function TapeAnimation({ step }: { step: number }) {
    const titles = [
        "Place tape at first corner",
        "Pull to opposite corner",
        "Read width and length"
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center w-full h-full p-6"
        >
            <div className="relative w-full max-w-[200px] h-32 mb-6 flex items-center justify-center">
                {/* Background Floor */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
                    <rect x="20" y="20" width="160" height="80" fill="#1e293b" rx="8" />

                    {/* Measurement Tape */}
                    <motion.rect
                        x="30"
                        y="55"
                        height="10"
                        fill="#fbbf24" // Amber tape
                        initial={{ width: 0 }}
                        animate={{
                            width: step === 0 ? 0 : step === 1 ? 120 : 140
                        }}
                        transition={{ duration: 1.5, type: "spring", bounce: 0.2 }}
                    />

                    {/* Tape Marks */}
                    <g opacity="0.5">
                        <motion.line x1="40" y1="55" x2="40" y2="60" stroke="#000" strokeWidth="1" animate={{ opacity: step > 0 ? 1 : 0 }} />
                        <motion.line x1="60" y1="55" x2="60" y2="60" stroke="#000" strokeWidth="1" animate={{ opacity: step > 0 ? 1 : 0 }} />
                        <motion.line x1="80" y1="55" x2="80" y2="65" stroke="#000" strokeWidth="1.5" animate={{ opacity: step > 0 ? 1 : 0 }} />
                        <motion.line x1="100" y1="55" x2="100" y2="60" stroke="#000" strokeWidth="1" animate={{ opacity: step > 0 ? 1 : 0 }} />
                        <motion.line x1="120" y1="55" x2="120" y2="60" stroke="#000" strokeWidth="1" animate={{ opacity: step > 0 ? 1 : 0 }} />
                        <motion.line x1="140" y1="55" x2="140" y2="65" stroke="#000" strokeWidth="1.5" animate={{ opacity: step > 0 ? 1 : 0 }} />
                    </g>

                    {/* Tape Case */}
                    <motion.rect
                        x={20}
                        y={45}
                        width="24"
                        height="24"
                        rx="6"
                        fill="#334155"
                        stroke="#94a3b8"
                        strokeWidth="2"
                        animate={{ x: step === 0 ? 10 : step === 1 ? 130 : 150 }}
                        transition={{ duration: 1.5, type: "spring", bounce: 0.2 }}
                    />
                    <motion.circle
                        cx="0"
                        cy="57"
                        r="6"
                        fill="#64748b"
                        animate={{ cx: step === 0 ? 32 : step === 1 ? 142 : 162 }}
                        transition={{ duration: 1.5, type: "spring", bounce: 0.2 }}
                    />
                </svg>

                {/* Reading display */}
                <AnimatePresence>
                    {step === 2 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="absolute bg-white text-slate-900 font-bold px-3 py-1 rounded-full text-xs shadow-xl top-0 translate-x-4"
                        >
                            25 ft 4 in
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <motion.p
                key={titles[step]}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center font-medium font-sm text-slate-200"
            >
                {titles[step]}
            </motion.p>
        </motion.div>
    );
}

// Visualizer component for the main form
export function AreaVisualizer({ width, length }: { width: number, length: number }) {
    // We want to scale the box to a maximum size but enforce a realistic ratio.
    const numericWidth = width || 1;
    const numericLength = length || 1;

    // Calculate aspect ratio (width / height)
    let ratio = numericWidth / numericLength;

    // Clamp ratio to avoid extremely thin or tall containers that break UI
    ratio = Math.max(0.3, Math.min(ratio, 3));

    return (
        <div className="w-full flex justify-center py-6 perspective-[800px]">
            <motion.div
                className="relative bg-primary/10 border-2 border-primary/30 rounded-lg shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] flex items-center justify-center overflow-hidden"
                animate={{
                    aspectRatio: ratio,
                    width: ratio >= 1 ? "100%" : `${ratio * 100}%`,
                    maxWidth: 240,
                    maxHeight: 240,
                    minHeight: 80,
                    minWidth: 80
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
                {/* SVG Grid overlay to look like pavers */}
                <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="pavers" width="20" height="20" patternUnits="userSpaceOnUse">
                            <rect width="20" height="20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
                            <path d="M 10 0 L 10 20 M 0 10 L 20 10" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#pavers)" />
                </svg>

                <div className="absolute inset-x-0 bottom-1 flex justify-center">
                    <span className="bg-background/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-medium text-foreground shadow-sm">
                        {width || 0} ft
                    </span>
                </div>
                <div className="absolute inset-y-0 right-1 flex items-center transform rotate-90 origin-right">
                    <span className="bg-background/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-medium text-foreground translate-x-1/2 -translate-y-2 shadow-sm whitespace-nowrap">
                        {length || 0} ft
                    </span>
                </div>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: (width > 0 && length > 0) ? 1 : 0 }}
                    className="z-10 bg-primary text-primary-foreground font-bold px-3 py-1.5 rounded-full text-sm shadow-xl flex items-center gap-1.5"
                >
                    {(width * length).toLocaleString()}
                    <span className="text-[10px] font-normal opacity-80 uppercase tracking-wider">sq ft</span>
                </motion.div>
            </motion.div>
        </div>
    );
}

// Helper numeric counter for smooth number changes
export function AnimatedNumber({ value }: { value: number }) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const duration = 800;
        const steps = 20;
        const stepTime = Math.abs(Math.floor(duration / steps));
        const increment = (value - displayValue) / steps;

        if (value === displayValue) return;

        let current = displayValue;
        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= value) || (increment < 0 && current <= value)) {
                setDisplayValue(value);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.round(current));
            }
        }, stepTime);

        return () => clearInterval(timer);
    }, [value, displayValue]);

    return <span>{displayValue.toLocaleString()}</span>;
}
