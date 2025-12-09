"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";

interface UsedChunk {
    id: string;
    docId: string;
    chunkIndex: number;
    startOffset: number;
    endOffset: number;
    text: string;
}

interface Props {
    usedChunks: UsedChunk[];
}

export function ChatCitations({ usedChunks }: Props) {
    const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set());

    if (!usedChunks || usedChunks.length === 0) {
        return null;
    }

    const toggleChunk = (chunkId: string) => {
        setExpandedChunks((prev) => {
            const next = new Set(prev);
            if (next.has(chunkId)) {
                next.delete(chunkId);
            } else {
                next.add(chunkId);
            }
            return next;
        });
    };

    return (
        <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <FileText className="h-3 w-3" />
                <span>Sources ({usedChunks.length})</span>
            </div>
            <div className="space-y-1.5">
                {usedChunks.map((chunk, idx) => {
                    const isExpanded = expandedChunks.has(chunk.id);
                    const previewText = chunk.text.slice(0, 120);
                    const needsTruncation = chunk.text.length > 120;

                    return (
                        <motion.div
                            key={chunk.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="rounded-lg border bg-card"
                        >
                            <button
                                onClick={() => toggleChunk(chunk.id)}
                                className="flex w-full items-start gap-2 p-2 text-left transition-colors hover:bg-muted/50"
                            >
                                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-semibold text-primary">
                                    {idx + 1}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <p className="text-xs text-foreground">
                                        {isExpanded ? chunk.text : previewText}
                                        {needsTruncation && !isExpanded && (
                                            <span className="text-muted-foreground">...</span>
                                        )}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        Chunk {chunk.chunkIndex + 1}
                                    </p>
                                </div>
                                {needsTruncation && (
                                    <div className="shrink-0">
                                        {isExpanded ? (
                                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </div>
                                )}
                            </button>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
