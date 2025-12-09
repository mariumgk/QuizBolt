"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { generateNotes, getUserNotes } from "@/app/actions/generate-notes";
import { createBrowserClient } from "@supabase/ssr";

interface Document {
  id: string;
  source_label: string;
}

interface Note {
  id: string;
  title: string;
  docId: string | null;
  style: string;
  createdAt: string;
}

export default function NotesPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [style, setStyle] = useState<"outline" | "summary" | "detailed">("summary");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch documents and existing notes
  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: docs } = await supabase
          .from("documents")
          .select("id, source_label")
          .order("created_at", { ascending: false });

        if (docs) {
          setDocuments(docs);
          if (docs.length > 0) {
            setSelectedDocId(docs[0].id);
          }
        }

        const existingNotes = await getUserNotes();
        setNotes(existingNotes);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchData();
  }, []);

  const handleGenerate = async () => {
    if (!selectedDocId) {
      setError("Please select a document");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const note = await generateNotes({
        docId: selectedDocId,
        style,
      });

      router.push(`/notes/${note.id}`);
    } catch (err) {
      console.error("Notes generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate notes");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">AI Notes</h1>
          <p className="text-sm text-muted-foreground">
            Generate structured study notes from your documents.
          </p>
        </div>
      </div>

      {/* Note Generator */}
      <div className="rounded-xl border bg-card p-4 space-y-4">
        <h2 className="text-sm font-semibold">Generate New Notes</h2>

        {isLoadingData ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : documents.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            <p>No documents found. Please upload a document first.</p>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => router.push("/upload")}
            >
              Go to Upload
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">Select Document</label>
                <select
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                >
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.source_label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Notes Style</label>
                <select
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                  value={style}
                  onChange={(e) => setStyle(e.target.value as typeof style)}
                >
                  <option value="summary">Summary - Key points and main ideas</option>
                  <option value="outline">Outline - Structured bullet points</option>
                  <option value="detailed">Detailed - Comprehensive notes</option>
                </select>
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button
              onClick={handleGenerate}
              disabled={isLoading || !selectedDocId}
            >
              {isLoading ? "Generating notes..." : "Generate Notes"}
            </Button>
          </>
        )}
      </div>

      {/* Existing Notes */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Your Notes</h2>

        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No notes yet. Generate some from your documents above.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className="group rounded-xl border bg-card p-4 transition-colors hover:border-primary"
              >
                <h3 className="mb-1 font-medium text-foreground group-hover:text-primary">
                  {note.title}
                </h3>
                <p className="mb-2 text-xs text-muted-foreground capitalize">
                  {note.style} style
                </p>
                <p className="text-xs text-muted-foreground">
                  Created {new Date(note.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
