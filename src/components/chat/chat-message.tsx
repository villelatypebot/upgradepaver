"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ChatMessageProps {
    type: "bot" | "user";
    children: ReactNode;
    className?: string;
    animate?: boolean;
}

export function ChatMessage({ type, children, className, animate = true }: ChatMessageProps) {
    const Wrapper = animate ? motion.div : "div";
    const animationProps = animate
        ? {
            initial: { opacity: 0, y: 12 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.3 },
        }
        : {};

    return (
        <Wrapper
            className={cn(
                "flex gap-3 w-full",
                type === "user" ? "justify-end" : "justify-start",
                className
            )}
            {...animationProps}
        >
            {type === "bot" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border bg-white shadow-sm mt-1">
                    <img src="/logo.png" alt="Bot" className="w-full h-full object-contain p-1" />
                </div>
            )}
            <div
                className={cn(
                    "max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    type === "bot"
                        ? "bg-white border border-border text-foreground shadow-sm rounded-tl-md"
                        : "bg-primary text-primary-foreground rounded-tr-md"
                )}
            >
                {children}
            </div>
        </Wrapper>
    );
}

export function TypingIndicator() {
    return (
        <motion.div
            className="flex gap-3 w-full justify-start"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
        >
            <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border bg-white shadow-sm mt-1">
                <img src="/logo.png" alt="Bot" className="w-full h-full object-contain p-1" />
            </div>
            <div className="bg-white border border-border rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1.5 items-center h-5">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full bg-muted-foreground/40"
                            animate={{ y: [0, -4, 0] }}
                            transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: i * 0.15,
                            }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
