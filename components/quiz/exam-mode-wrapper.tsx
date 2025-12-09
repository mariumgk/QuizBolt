"use client";

import { useEffect, useCallback } from "react";

interface ExamModeWrapperProps {
    isActive: boolean;
    onViolation: () => void;
    onWarning?: (msg: string) => void;
    children: React.ReactNode;
}

export function ExamModeWrapper({ isActive, onViolation, onWarning, children }: ExamModeWrapperProps) {

    const handleViolation = useCallback(() => {
        if (!isActive) return;
        onViolation();
    }, [isActive, onViolation]);

    useEffect(() => {
        if (!isActive) return;

        // Prevent context menu
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            onWarning?.("Right-click is disabled in Exam Mode");
        };

        // Prevent copy/paste/cut via keyboard
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                (e.ctrlKey || e.metaKey) &&
                (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'p' || e.key === 's')
            ) {
                e.preventDefault();
                onWarning?.("Clipboard shortcuts are disabled");
            }

            // Prevent F12/Inspect (basic)
            if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
                e.preventDefault();
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                handleViolation();
            }
        };

        const handleBlur = () => {
            // Window lost focus - debatable if this should strictly trigger, 
            // but for strict exam mode, yes.
            handleViolation();
        };

        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);

        return () => {
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
        };
    }, [isActive, handleViolation, onWarning]);

    return (
        <div className={isActive ? "select-none" : ""}>
            {children}
            {isActive && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center text-xs py-1 font-bold animate-pulse">
                    EXAM MODE ACTIVE - DO NOT SWITCH TABS
                </div>
            )}
        </div>
    );
}
