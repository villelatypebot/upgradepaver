"use client";

import { useState } from "react";
import { ChatMessage } from "../chat-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, User, Phone, ArrowRight, SkipForward } from "lucide-react";

interface StepLeadCaptureProps {
    onSubmit: (lead: { name: string; email: string; phone?: string }) => void;
    onSkip: () => void;
    answered: boolean;
    answeredData?: { name: string; email: string } | null;
    isRequired: boolean;
}

export function StepLeadCapture({
    onSubmit,
    onSkip,
    answered,
    answeredData,
    isRequired,
}: StepLeadCaptureProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

    const validate = () => {
        const errs: { name?: string; email?: string } = {};
        if (!name.trim()) errs.name = "Name is required";
        if (!email.trim()) errs.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Invalid email format";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        onSubmit({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined });
    };

    return (
        <>
            <ChatMessage type="bot">
                <p className="font-semibold mb-1">Before we continue, how can we reach you?</p>
                <p className="text-muted-foreground text-xs">We&apos;ll send your quote details and keep you updated.</p>
            </ChatMessage>

            {!answered ? (
                <div className="mx-2">
                    <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-4 shadow-sm space-y-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs flex items-center gap-1.5">
                                <User className="w-3 h-3" /> Name *
                            </Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name"
                                className={errors.name ? "border-destructive" : ""}
                            />
                            {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs flex items-center gap-1.5">
                                <Mail className="w-3 h-3" /> Email *
                            </Label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                className={errors.email ? "border-destructive" : ""}
                            />
                            {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs flex items-center gap-1.5">
                                <Phone className="w-3 h-3" /> Phone (optional)
                            </Label>
                            <Input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="(555) 123-4567"
                            />
                        </div>
                        <div className="flex gap-2 pt-1">
                            <Button type="submit" className="flex-1 font-semibold">
                                <ArrowRight className="mr-1.5 h-4 w-4" />
                                Continue
                            </Button>
                            {!isRequired && (
                                <Button type="button" variant="ghost" size="sm" onClick={onSkip} className="text-xs text-muted-foreground">
                                    <SkipForward className="mr-1 h-3 w-3" />
                                    Skip
                                </Button>
                            )}
                        </div>
                    </form>
                </div>
            ) : (
                <ChatMessage type="user">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 opacity-70" />
                        <span>{answeredData?.name} &middot; {answeredData?.email}</span>
                    </div>
                </ChatMessage>
            )}
        </>
    );
}
