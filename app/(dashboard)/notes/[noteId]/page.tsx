"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getNote, updateNote, deleteNote, type GeneratedNote } from "@/app/actions/generate-notes";

export default function NoteDetailPage() {
    const params = useParams<{ noteId: string }>();
    const router = useRouter();
    const noteId = params?.noteId;

    const [note, setNote] = useState<GeneratedNote | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadNote() {
            if (!noteId) return;

            try {
                const data = await getNote(noteId);
                if (data) {
                    setNote(data);
                    setEditContent(data.content);
                }
            } catch (err) {
                console.error("Failed to load note:", err);
                setError("Failed to load note");
            } finally {
                setIsLoading(false);
            }
        }

        loadNote();
    }, [noteId]);

    const handleSave = async () => {
        if (!noteId) return;

        setIsSaving(true);
        setError(null);

        try {
            await updateNote({ noteId, content: editContent });
            setNote((prev) => prev ? { ...prev, content: editContent } : null);
            setIsEditing(false);
        } catch (err) {
            console.error("Save error:", err);
            setError(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!noteId || !confirm("Are you sure you want to delete these notes?")) return;

        try {
            await deleteNote(noteId);
            router.push("/notes");
        } catch (err) {
            console.error("Delete error:", err);
            setError(err instanceof Error ? err.message : "Failed to delete");
        }
    };

    const handleExport = () => {
        if (!note) return;

        const blob = new Blob([note.content], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${note.title.replace(/[^a-z0-9]/gi, "_")}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return <p className="text-sm text-muted-foreground">Loading note...</p>;
    }

    if (!note) {
        return (
            <div className="space-y-4">
                <p className="text-sm text-red-500">{error || "Note not found"}</p>
                <Button variant="outline" onClick={() => router.push("/notes")}>
                    Back to Notes
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-xl font-semibold">{note.title}</h1>
                    <p className="text-sm text-muted-foreground">
                        {note.style} style - Updated {new Date(note.updatedAt).toLocaleString()}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push("/notes")}>
                        Back
                    </Button>
                    <Button variant="outline" onClick={handleExport}>
                        Export
                    </Button>
                    {isEditing ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditContent(note.content);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? "Saving..." : "Save"}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(true)}>
                                Edit
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleDelete}
                                className="border-red-500 text-red-500 hover:bg-red-50"
                            >
                                Delete
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            {isEditing ? (
                <textarea
                    className="min-h-[500px] w-full resize-y rounded-xl border bg-background p-4 font-mono text-sm"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Write your notes in Markdown format..."
                />
            ) : (
                <div className="rounded-xl border bg-card p-6">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                        {/* Simple markdown rendering */}
                        {note.content.split("\n").map((line, idx) => {
                            // Headers
                            if (line.startsWith("### ")) {
                                return <h3 key={idx} className="mt-4 text-lg font-semibold">{line.slice(4)}</h3>;
                            }
                            if (line.startsWith("## ")) {
                                return <h2 key={idx} className="mt-6 text-xl font-semibold">{line.slice(3)}</h2>;
                            }
                            if (line.startsWith("# ")) {
                                return <h1 key={idx} className="mt-6 text-2xl font-bold">{line.slice(2)}</h1>;
                            }
                            // Bold
                            if (line.includes("**")) {
                                const parts = line.split(/\*\*([^*]+)\*\*/g);
                                return (
                                    <p key={idx} className="my-1">
                                        {parts.map((part, i) =>
                                            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                                        )}
                                    </p>
                                );
                            }
                            // Bullet points
                            if (line.startsWith("- ") || line.startsWith("* ")) {
                                return (
                                    <li key={idx} className="ml-4 list-disc">
                                        {line.slice(2)}
                                    </li>
                                );
                            }
                            // Numbered items
                            if (/^\d+\. /.test(line)) {
                                return (
                                    <li key={idx} className="ml-4 list-decimal">
                                        {line.replace(/^\d+\. /, "")}
                                    </li>
                                );
                            }
                            // Empty lines
                            if (!line.trim()) {
                                return <br key={idx} />;
                            }
                            // Regular paragraphs
                            return <p key={idx} className="my-1">{line}</p>;
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
