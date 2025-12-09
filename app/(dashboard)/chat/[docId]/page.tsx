"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatCitations } from "@/components/chat/chat-citations";
import { DocumentPreview } from "@/components/chat/document-preview";
import { ragChat, type RagChatMessage } from "@/app/actions/rag-chat";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: string;
    usedChunks?: Array<{
        id: string;
        docId: string;
        chunkIndex: number;
        startOffset: number;
        endOffset: number;
        text: string;
    }>;
}

interface DocumentInfo {
    id: string;
    source_label: string;
    created_at: string;
}

export default function ChatPage() {
    const params = useParams();
    const docId = params?.docId as string;

    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [documentInfo, setDocumentInfo] = useState<DocumentInfo | null>(null);

    // Fetch document info on mount
    useEffect(() => {
        async function fetchDocumentInfo() {
            if (!docId) return;

            try {
                const supabase = createBrowserClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                );

                const { data, error } = await supabase
                    .from("documents")
                    .select("id, source_label, created_at")
                    .eq("id", docId)
                    .single();

                if (!error && data) {
                    setDocumentInfo(data);
                }
            } catch (err) {
                console.error("Failed to fetch document info:", err);
            }
        }

        fetchDocumentInfo();
    }, [docId]);

    const handleSendMessage = async (query: string) => {
        if (!query.trim() || !docId) return;

        setIsLoading(true);
        setError(null);

        // Add user message immediately
        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: "user",
            content: query,
            createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);

        try {
            // Build history from previous messages
            const history: RagChatMessage[] = messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
            }));

            // Call RAG chat server action
            const response = await ragChat({
                docId,
                query,
                history,
            });

            // Add assistant message with citations
            const assistantMessage: Message = {
                id: `assistant-${Date.now()}`,
                role: "assistant",
                content: response.answer,
                createdAt: new Date().toISOString(),
                usedChunks: response.usedChunks,
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (err) {
            console.error("Chat error:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to get response. Please try again."
            );

            // Remove the user message on error
            setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto max-w-7xl p-4">
            <div className="mb-4">
                <h1 className="text-2xl font-semibold">Chat with Your Document</h1>
                <p className="text-sm text-muted-foreground">
                    Ask questions and get AI-powered answers based on your document content.
                </p>
            </div>

            <div className="grid h-[calc(100vh-12rem)] gap-4 md:grid-cols-[2fr,1fr]">
                {/* Chat area */}
                <div className="flex flex-col gap-3">
                    <div className="flex-1 overflow-hidden rounded-xl border bg-card">
                        <div className="flex h-full flex-col p-4">
                            {/* Messages */}
                            <div className="flex-1 space-y-4 overflow-y-auto pb-4">
                                {messages.length === 0 && !isLoading && (
                                    <div className="flex h-full items-center justify-center">
                                        <p className="text-sm text-muted-foreground">
                                            Start a conversation by asking a question about your document.
                                        </p>
                                    </div>
                                )}

                                {messages.map((message) => (
                                    <div key={message.id} className="space-y-2">
                                        <div className="flex gap-3">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                                {message.role === "user" ? "YOU" : "AI"}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="rounded-lg bg-muted px-4 py-2">
                                                    <p className="text-sm leading-relaxed">
                                                        {message.content}
                                                    </p>
                                                </div>
                                                {message.role === "assistant" && message.usedChunks && (
                                                    <ChatCitations usedChunks={message.usedChunks} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                            AI
                                        </div>
                                        <div className="flex-1">
                                            <div className="rounded-lg bg-muted px-4 py-2">
                                                <p className="text-sm text-muted-foreground">
                                                    Thinking...
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Error display */}
                            {error && (
                                <div className="mb-3 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2">
                                    <p className="text-xs text-destructive">{error}</p>
                                </div>
                            )}

                            {/* Input */}
                            <div className="border-t pt-3">
                                <ChatInput onSend={handleSendMessage} disabled={isLoading} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Document preview sidebar */}
                <div className="hidden md:block">
                    <DocumentPreview
                        title={documentInfo?.source_label || "Loading..."}
                    />
                </div>
            </div>
        </div>
    );
}
