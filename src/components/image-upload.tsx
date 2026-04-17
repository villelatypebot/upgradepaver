
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { MAX_UPLOAD_FILE_MB, prepareImageForAnalysis } from "@/lib/image-upload";

interface ImageUploadProps {
    selectedImage: string | null;
    onImageSelect: (imageUrl: string | null) => void;
}

export function ImageUpload({ selectedImage, onImageSelect }: ImageUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isPreparing, setIsPreparing] = useState(false);

    const handleFile = async (file: File) => {
        setIsPreparing(true);

        try {
            const prepared = await prepareImageForAnalysis(file);
            onImageSelect(prepared.dataUrl);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to prepare the selected image.";
            toast.error(message);
        } finally {
            setIsPreparing(false);
        }
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.[0]) {
            void handleFile(e.dataTransfer.files[0]);
        }
    };

    if (selectedImage) {
        return (
            <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-border shadow-sm group">
                <img
                    src={selectedImage}
                    alt="Selected"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={isPreparing}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {isPreparing ? "Preparing..." : "Change Image"}
                    </Button>
                    <Button
                        variant="destructive"
                        size="icon"
                        disabled={isPreparing}
                        onClick={() => onImageSelect(null)}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
                <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={(e) => {
                        if (e.target.files?.[0]) {
                            void handleFile(e.target.files[0]);
                        }
                        e.target.value = "";
                    }}
                />
            </div>
        );
    }

    return (
        <Card
            className={cn(
                "border-2 border-dashed aspect-video flex flex-col items-center justify-center p-6 cursor-pointer transition-all duration-200 bg-muted/20 hover:bg-muted/40",
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            )}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
        >
            <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                accept="image/*"
                onChange={(e) => {
                    if (e.target.files?.[0]) {
                        void handleFile(e.target.files[0]);
                    }
                    e.target.value = "";
                }}
            />
            <div className="rounded-full bg-background p-4 mb-4 shadow-sm border">
                {isPreparing ? <Loader2 className="w-8 h-8 text-primary animate-spin" /> : <Upload className="w-8 h-8 text-primary/80" />}
            </div>
            <h3 className="font-semibold text-lg text-foreground/80 mb-1">
                {isPreparing ? "Preparing your photo" : "Upload your photo"}
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
                {isPreparing
                    ? "Optimizing image quality for the AI..."
                    : `Drag & drop or click to browse. We support photos up to ${MAX_UPLOAD_FILE_MB} MB.`}
            </p>
        </Card>
    );
}
