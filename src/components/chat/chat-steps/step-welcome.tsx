"use client";

import { ChatMessage } from "../chat-message";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface StepWelcomeProps {
    onStart: () => void;
    answered: boolean;
}

export function StepWelcome({ onStart, answered }: StepWelcomeProps) {
    return (
        <>
            <ChatMessage type="bot">
                <p className="font-semibold text-base mb-2">Welcome to Direct Pavers!</p>
                <p>
                    I&apos;ll help you visualize and quote your dream patio project. Here&apos;s what we&apos;ll do:
                </p>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-muted-foreground">
                    <li>Upload photos of your space</li>
                    <li>Enter your area measurements</li>
                    <li>Choose your paver style</li>
                    <li>See a realistic visualization</li>
                    <li>Get your material & labor quote</li>
                </ol>
            </ChatMessage>
            {!answered ? (
                <div className="flex justify-center mt-4">
                    <Button onClick={onStart} size="lg" className="px-8 font-semibold shadow-lg">
                        Let&apos;s Go! <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <ChatMessage type="user">Let&apos;s Go!</ChatMessage>
            )}
        </>
    );
}
