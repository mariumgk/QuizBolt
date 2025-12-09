"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getDocumentsWithAssets, deleteDocument, type DocumentWithAssets } from "@/app/actions/library";

export default function LibraryPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentWithAssets[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      const data = await getDocumentsWithAssets();
      setDocuments(data);
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleDelete = async (docId: string, docName: string) => {
    if (!confirm(`Delete "${docName}" and all associated quizzes, flashcards, and notes?`)) {
      return;
    }

    setDeletingId(docId);
    try {
      await deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  };

  const getSourceTypeLabel = (type: string) => {
    switch (type) {
      case "upload":
        return "PDF";
      case "url":
        return "URL";
      case "text":
        return "Text";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Document Library</h1>
          <p className="text-sm text-muted-foreground">
            All your documents with linked quizzes, flashcards, and notes.
          </p>
        </div>
        <Link href="/upload">
          <Button>Upload Document</Button>
        </Link>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading documents...</p>
      ) : documents.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            No documents yet. Upload your first document to get started.
          </p>
          <Link href="/upload">
            <Button variant="outline">Upload Document</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="rounded-xl border bg-card p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-foreground truncate">
                    {doc.sourceLabel}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {getSourceTypeLabel(doc.sourceType)} - {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="shrink-0 text-xs px-2 py-0.5 rounded bg-muted">
                  {getSourceTypeLabel(doc.sourceType)}
                </span>
              </div>

              {/* Asset counts */}
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span>{doc.quizCount} quiz{doc.quizCount !== 1 ? "zes" : ""}</span>
                <span>{doc.flashcardCount} flashcard{doc.flashcardCount !== 1 ? "s" : ""}</span>
                <span>{doc.noteCount} note{doc.noteCount !== 1 ? "s" : ""}</span>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Link href={`/chat/${doc.id}`}>
                  <Button variant="outline" size="sm">Chat</Button>
                </Link>
                <Link href={`/quizzes/create?docId=${doc.id}`}>
                  <Button variant="outline" size="sm">Quiz</Button>
                </Link>
                <Link href={`/flashcards/create?docId=${doc.id}`}>
                  <Button variant="outline" size="sm">Flashcards</Button>
                </Link>
                <Link href={`/notes?docId=${doc.id}`}>
                  <Button variant="outline" size="sm">Notes</Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(doc.id, doc.sourceLabel)}
                  disabled={deletingId === doc.id}
                >
                  {deletingId === doc.id ? "..." : "Delete"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
