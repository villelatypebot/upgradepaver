"use client";

import { useState, useRef } from "react";
import { ChatMessage } from "../chat-message";
import { Button } from "@/components/ui/button";
import { Upload, X, Plus, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { MAX_UPLOAD_FILE_MB, prepareImageForAnalysis } from "@/lib/image-upload";

interface StepPhotosProps {
    photos: string[];
    onPhotosChange: (photos: string[]) => void;
    onContinue: () => void;
    answered: boolean;
}

export function StepPhotos({ photos, onPhotosChange, onContinue, answered }: StepPhotosProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isPreparing, setIsPreparing] = useState(false);

    const handleFiles = async (files: FileList) => {
        setIsPreparing(true);

        try {
            const nextPhotos = [...photos];

            for (const file of Array.from(files)) {
                try {
                    const prepared = await prepareImageForAnalysis(file);
                    nextPhotos.push(prepared.dataUrl);
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : "Failed to prepare the selected image.";
                    toast.error(message);
                }
            }

            onPhotosChange(nextPhotos);
        } finally {
            setIsPreparing(false);
        }
    };

    const removePhoto = (index: number) => {
        onPhotosChange(photos.filter((_, i) => i !== index));
    };

    if (answered) {
        return (
            <>
                <ChatMessage type="bot">
                    Upload photos of the area you want to transform first. We&apos;ll generate the visualization before we ask for measurements.
                </ChatMessage>
                <ChatMessage type="user">
                    <div className="flex flex-wrap gap-2">
                        {photos.map((photo, i) => (
                            <img key={i} src={photo} alt={`Photo ${i + 1}`} className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-cover" />
                        ))}
                        <span className="self-center ml-1 text-sm">{photos.length} photo{photos.length !== 1 ? "s" : ""} uploaded</span>
                    </div>
                </ChatMessage>
            </>
        );
    }

    return (
        <>
            <ChatMessage type="bot">
                <p>Upload photos of the area you want to transform first. You can add multiple photos.</p>
                <p className="text-xs text-muted-foreground mt-1">
                    We accept images up to {MAX_UPLOAD_FILE_MB} MB each and optimize large files automatically before analysis.
                </p>
            </ChatMessage>
            <div className="mt-3 space-y-3">
                {photos.length > 0 && (
                    <div className="flex flex-wrap gap-2 md:gap-3 px-2">
                        {photos.map((photo, i) => (
                            <div key={i} className="relative group w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border shadow-sm">
                                <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                                <button
                                    onClick={() => removePhoto(i)}
                                    className="absolute top-1 right-1 bg-destructive text-white rounded-full p-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        <button
                            disabled={isPreparing}
                            onClick={() => fileInputRef.current?.click()}
                            className="w-20 h-20 md:w-24 md:h-24 rounded-xl border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                        >
                            {isPreparing ? (
                                <>
                                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                    <span className="text-[10px] text-muted-foreground">Preparing...</span>
                                </>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5 text-muted-foreground" />
                                    <span className="text-[10px] text-muted-foreground">Add more</span>
                                </>
                            )}
                        </button>
                    </div>
                )}

                {photos.length === 0 && (
                    <Card
                        className={cn(
                            "border-2 border-dashed flex flex-col items-center justify-center p-6 md:p-8 cursor-pointer transition-all duration-200 bg-muted/20 hover:bg-muted/40 mx-2",
                            isPreparing && "pointer-events-none opacity-70",
                            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                        )}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            if (e.dataTransfer.files) {
                                void handleFiles(e.dataTransfer.files);
                            }
                        }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="rounded-full bg-background p-3 mb-3 shadow-sm border">
                            {isPreparing ? <Loader2 className="w-6 h-6 text-primary animate-spin" /> : <Upload className="w-6 h-6 text-primary/80" />}
                        </div>
                        <p className="font-medium text-sm text-foreground/80">{isPreparing ? "Preparing your photos" : "Upload your photos"}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {isPreparing ? "Optimizing image quality for the AI..." : "Tap to browse or take a photo"}
                        </p>
                    </Card>
                )}

                <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                        if (e.target.files) {
                            void handleFiles(e.target.files);
                        }
                        e.target.value = "";
                    }}
                />

                {photos.length > 0 && (
                    <div className="flex justify-center">
                        <Button onClick={onContinue} className="px-6" disabled={isPreparing}>
                            Continue <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}
