"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface Document {
  id: string;
  source_label: string;
  created_at: string;
}

export default function ChatPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data, error } = await supabase
          .from("documents")
          .select("id, source_label, created_at")
          .order("created_at", { ascending: false })
          .limit(10);

        if (!error && data) {
          setDocuments(data);
        }
      } catch (err) {
        console.error("Failed to fetch documents:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocuments();
  }, []);

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Chat with Your Documents</h1>
        <p className="text-sm text-muted-foreground">
          Select a document to start asking questions with AI-powered RAG.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <h2 className="mb-2 text-lg font-medium">No documents yet</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Upload a PDF, paste text, or enter a URL to get started.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Upload Document
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Your Documents</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {documents.map((doc) => (
              <Link
                key={doc.id}
                href={`/chat/${doc.id}`}
                className="group rounded-xl border bg-card p-4 transition-colors hover:border-primary"
              >
                <h3 className="mb-1 font-medium text-foreground group-hover:text-primary">
                  {doc.source_label}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {new Date(doc.created_at).toLocaleDateString()} at{" "}
                  {new Date(doc.created_at).toLocaleTimeString()}
                </p>
                <div className="mt-3 flex items-center gap-1 text-xs text-primary">
                  Start Chat
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/upload"
              className="text-sm text-primary hover:underline"
            >
              + Upload another document
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
