
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface ImageUploadProps {
    selectedImage: string | null;
    onImageSelect: (imageUrl: string | null) => void;
}

export function ImageUpload({ selectedImage, onImageSelect }: ImageUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFile = (file: File) => {
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => {
                onImageSelect(e.target?.result as string);
            };
            reader.readAsDataURL(file);
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
            handleFile(e.dataTransfer.files[0]);
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
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Change Image
                    </Button>
                    <Button
                        variant="destructive"
                        size="icon"
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
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
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
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <div className="rounded-full bg-background p-4 mb-4 shadow-sm border">
                <Upload className="w-8 h-8 text-primary/80" />
            </div>
            <h3 className="font-semibold text-lg text-foreground/80 mb-1">
                Upload your photo
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
                Drag & drop or click to browse. We support JPG and PNG.
            </p>
        </Card>
    );
}
