"use client";

import { useState, useRef } from "react";
import { ChatMessage } from "../chat-message";
import { Button } from "@/components/ui/button";
import { Upload, X, Plus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface StepPhotosProps {
    photos: string[];
    onPhotosChange: (photos: string[]) => void;
    onContinue: () => void;
    answered: boolean;
}

export function StepPhotos({ photos, onPhotosChange, onContinue, answered }: StepPhotosProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFile = (file: File) => {
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                onPhotosChange([...photos, result]);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFiles = (files: FileList) => {
        Array.from(files).forEach(handleFile);
    };

    const removePhoto = (index: number) => {
        onPhotosChange(photos.filter((_, i) => i !== index));
    };

    if (answered) {
        return (
            <>
                <ChatMessage type="bot">
                    Upload photos of the area you want to transform. You can add multiple photos.
                </ChatMessage>
                <ChatMessage type="user">
                    <div className="flex flex-wrap gap-2">
                        {photos.map((photo, i) => (
                            <img key={i} src={photo} alt={`Photo ${i + 1}`} className="w-16 h-16 rounded-lg object-cover" />
                        ))}
                        <span className="self-center ml-1">{photos.length} photo{photos.length !== 1 ? "s" : ""} uploaded</span>
                    </div>
                </ChatMessage>
            </>
        );
    }

    return (
        <>
            <ChatMessage type="bot">
                Upload photos of the area you want to transform. You can add multiple photos.
            </ChatMessage>
            <div className="mt-3 space-y-3">
                {photos.length > 0 && (
                    <div className="flex flex-wrap gap-3 px-2">
                        {photos.map((photo, i) => (
                            <div key={i} className="relative group w-24 h-24 rounded-xl overflow-hidden border shadow-sm">
                                <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                                <button
                                    onClick={() => removePhoto(i)}
                                    className="absolute top-1 right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-24 h-24 rounded-xl border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                        >
                            <Plus className="w-5 h-5 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">Add more</span>
                        </button>
                    </div>
                )}

                {photos.length === 0 && (
                    <Card
                        className={cn(
                            "border-2 border-dashed flex flex-col items-center justify-center p-8 cursor-pointer transition-all duration-200 bg-muted/20 hover:bg-muted/40 mx-2",
                            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                        )}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                        onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files); }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="rounded-full bg-background p-3 mb-3 shadow-sm border">
                            <Upload className="w-6 h-6 text-primary/80" />
                        </div>
                        <p className="font-medium text-sm text-foreground/80">Upload your photos</p>
                        <p className="text-xs text-muted-foreground mt-1">Drag & drop or click to browse</p>
                    </Card>
                )}

                <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />

                {photos.length > 0 && (
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
