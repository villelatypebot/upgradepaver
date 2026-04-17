"use client";

import { useState } from "react";
import { ChatMessage } from "../chat-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Ruler, HelpCircle, Plus, Trash2 } from "lucide-react";
import { HowToMeasureGuide, AreaVisualizer, AnimatedNumber } from "./how-to-measure-guide";
import { motion, AnimatePresence } from "framer-motion";
import {
    MeasurementArea,
    MAX_MEASUREMENT_AREAS,
    createMeasurementArea,
    formatMeasurementAreaLabel,
    getAreaSqft,
    getCompletedMeasurementAreas,
    getTotalMeasurementSqft,
} from "@/lib/measurements";

interface StepMeasurementsProps {
    areas: MeasurementArea[];
    onAreasChange: (areas: MeasurementArea[]) => void;
    onContinue: () => void;
    answered: boolean;
    previewUnavailable?: boolean;
}

export function StepMeasurements({ areas, onAreasChange, onContinue, answered, previewUnavailable = false }: StepMeasurementsProps) {
    const totalSqft = getTotalMeasurementSqft(areas);
    const completedAreas = getCompletedMeasurementAreas(areas);
    const previewArea = completedAreas[0] || areas[0];
    const previewAreaIndex = previewArea ? areas.findIndex((area) => area.id === previewArea.id) : -1;
    const [showGuide, setShowGuide] = useState(false);

    const updateArea = (id: string, patch: Partial<MeasurementArea>) => {
        onAreasChange(
            areas.map((area) => (area.id === id ? { ...area, ...patch } : area)),
        );
    };

    const addArea = () => {
        if (areas.length >= MAX_MEASUREMENT_AREAS) {
            return;
        }

        onAreasChange([...areas, createMeasurementArea(areas.length)]);
    };

    const removeArea = (id: string) => {
        if (areas.length === 1) {
            onAreasChange([createMeasurementArea(0)]);
            return;
        }

        onAreasChange(areas.filter((area) => area.id !== id));
    };

    if (answered) {
        return (
            <>
                <ChatMessage type="bot">
                    What are the measurements of the area? Now let&apos;s size the project so we can build your quote.
                </ChatMessage>
                <ChatMessage type="user">
                    <div className="space-y-1.5">
                        {completedAreas.map((area, index) => (
                            <p key={area.id}>
                                {formatMeasurementAreaLabel(area, index)}: {area.width} ft x {area.length} ft = {getAreaSqft(area)} sq ft
                            </p>
                        ))}
                        <p className="font-medium">Total: {totalSqft} sq ft</p>
                    </div>
                </ChatMessage>
            </>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
            <ChatMessage type="bot">
                <p className="text-lg font-medium tracking-tight">
                    {previewUnavailable
                        ? "We couldn&apos;t render the preview this time, but we can still build your quote."
                        : "Your preview is ready. Now let&apos;s build the quote."}
                </p>
                <p className="text-muted-foreground mt-1 mb-3 text-sm">
                    Add up to four areas in feet, like a patio, driveway, walkway, or side yard.
                </p>

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
                        <div className="flex items-center justify-between gap-3 mb-6">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Ruler className="w-4 h-4 text-primary" />
                                </div>
                                Project Dimensions
                            </div>
                            {areas.length < MAX_MEASUREMENT_AREAS && (
                                <Button type="button" variant="outline" size="sm" onClick={addArea} className="rounded-full">
                                    <Plus className="mr-1 h-4 w-4" />
                                    Add Area
                                </Button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {areas.map((area, index) => {
                                const areaSqft = getAreaSqft(area);

                                return (
                                    <div key={area.id} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                                        <div className="flex items-start justify-between gap-3 mb-4">
                                            <div className="flex-1 space-y-1.5">
                                                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider pl-1">
                                                    Area Name
                                                </label>
                                                <Input
                                                    placeholder={`Area ${index + 1}`}
                                                    value={area.label}
                                                    onChange={(e) => updateArea(area.id, { label: e.target.value })}
                                                    className="h-12 rounded-2xl bg-white border-slate-200"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() => removeArea(area.id)}
                                                className="mt-6 text-muted-foreground hover:text-destructive"
                                                aria-label={`Remove ${formatMeasurementAreaLabel(area, index)}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
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
                                                    value={area.width || ""}
                                                    onChange={(e) => updateArea(area.id, { width: Number(e.target.value) })}
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
                                                    value={area.length || ""}
                                                    onChange={(e) => updateArea(area.id, { length: Number(e.target.value) })}
                                                    className="h-14 text-lg font-medium rounded-2xl bg-white border-slate-200 focus-visible:ring-primary/20 transition-all font-mono"
                                                />
                                                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary origin-left scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-b-2xl opacity-50" />
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {areaSqft > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="mt-4 flex items-center justify-between rounded-2xl bg-slate-100/80 border border-slate-200/60 px-4 py-3"
                                                >
                                                    <span className="text-sm font-medium text-slate-500">
                                                        {formatMeasurementAreaLabel(area, index)}
                                                    </span>
                                                    <span className="text-base font-semibold text-primary">{areaSqft} sq ft</span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>

                        <AnimatePresence>
                            {previewArea && (previewArea.width > 0 || previewArea.length > 0) && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                    animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                    className="overflow-hidden"
                                >
                                    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold text-center mb-2">
                                        Layout Preview: {formatMeasurementAreaLabel(previewArea, Math.max(previewAreaIndex, 0))}
                                    </p>
                                    <AreaVisualizer width={previewArea.width} length={previewArea.length} />
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
                                    <span className="text-sm font-medium text-slate-500">Total project area</span>
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
