"use client";

import { useState } from "react";
import { ChatMessage } from "../chat-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Ruler, HelpCircle } from "lucide-react";
import { HowToMeasureGuide, AreaVisualizer, AnimatedNumber } from "./how-to-measure-guide";
import { motion, AnimatePresence } from "framer-motion";

interface StepMeasurementsProps {
    width: number;
    length: number;
    onMeasurementsChange: (width: number, length: number) => void;
    onContinue: () => void;
    answered: boolean;
}

export function StepMeasurements({ width, length, onMeasurementsChange, onContinue, answered }: StepMeasurementsProps) {
    const totalSqft = width * length;
    const [showGuide, setShowGuide] = useState(false);

    if (answered) {
        return (
            <>
                <ChatMessage type="bot">
                    What are the measurements of the area? Now let&apos;s size the project so we can build your quote.
                </ChatMessage>
                <ChatMessage type="user">
                    {width} ft x {length} ft = {totalSqft} sq ft
                </ChatMessage>
            </>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
            <ChatMessage type="bot">
                <p className="text-lg font-medium tracking-tight">Your preview is ready. Now let&apos;s build the quote.</p>
                <p className="text-muted-foreground mt-1 mb-3 text-sm">Enter the width and length of your project area in feet.</p>

                <button
                    onClick={() => setShowGuide(!showGuide)}
                    className="group flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full transition-all duration-300"
                >
                    <HelpCircle className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                    How to measure like a pro
                </button>
            </ChatMessage>

            <HowToMeasureGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />

            <div className="mt-4 px-2">
                <motion.div
                    className="bg-white border rounded-3xl overflow-hidden shadow-lg p-1 relative"
                    initial={false}
                    animate={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    <div className="bg-slate-50/50 rounded-[22px] p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-6">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Ruler className="w-4 h-4 text-primary" />
                            </div>
                            Project Dimensions
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5 group relative">
                                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider pl-1 transition-colors group-focus-within:text-primary">
                                    Width (ft)
                                </label>
                                <Input
                                    type="number"
                                    min={1}
                                    placeholder="e.g. 20"
                                    value={width || ""}
                                    onChange={(e) => onMeasurementsChange(Number(e.target.value), length)}
                                    className="h-14 text-lg font-medium rounded-2xl bg-white border-slate-200 focus-visible:ring-primary/20 transition-all font-mono"
                                />
                                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary origin-left scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-b-2xl opacity-50" />
                            </div>
                            <div className="space-y-1.5 group relative">
                                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider pl-1 transition-colors group-focus-within:text-primary">
                                    Length (ft)
                                </label>
                                <Input
                                    type="number"
                                    min={1}
                                    placeholder="e.g. 25"
                                    value={length || ""}
                                    onChange={(e) => onMeasurementsChange(width, Number(e.target.value))}
                                    className="h-14 text-lg font-medium rounded-2xl bg-white border-slate-200 focus-visible:ring-primary/20 transition-all font-mono"
                                />
                                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary origin-left scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-b-2xl opacity-50" />
                            </div>
                        </div>

                        {/* Interactive Area Visualizer */}
                        <AnimatePresence>
                            {(width > 0 || length > 0) && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                    animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                    className="overflow-hidden"
                                >
                                    <AreaVisualizer width={width} length={length} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {totalSqft > 0 && (
                                <motion.div
                                    className="flex justify-between items-center bg-slate-100/80 rounded-2xl px-5 py-4 mt-6 border border-slate-200/60 transition-colors"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                >
                                    <span className="text-sm font-medium text-slate-500">Total area</span>
                                    <div className="flex items-end gap-1.5">
                                        <span className="font-bold text-primary text-3xl leading-none tracking-tight">
                                            <AnimatedNumber value={totalSqft} />
                                        </span>
                                        <span className="text-sm font-semibold text-primary/70 mb-1">sq ft</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                <AnimatePresence>
                    {totalSqft > 0 && (
                        <motion.div
                            className="flex justify-center mt-6 z-10 relative"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.1 }}
                        >
                            <Button
                                onClick={onContinue}
                                size="lg"
                                className="px-8 rounded-full shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5 transition-all duration-300 font-semibold text-base py-6 w-full max-w-[280px]"
                            >
                                See My Quote <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
