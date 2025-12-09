"use server";

import { createServerSupabaseClient } from "@/supabase/server";

export interface DocumentWithAssets {
    id: string;
    sourceLabel: string;
    sourceType: string;
    createdAt: string;
    quizCount: number;
    flashcardCount: number;
    noteCount: number;
}

export async function getDocumentsWithAssets(): Promise<DocumentWithAssets[]> {
    const supabase = createServerSupabaseClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    // Fetch all documents
    const { data: documents, error: docError } = await supabase
        .from("documents")
        .select("id, source_label, source_type, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (docError || !documents) {
        console.error("Failed to fetch documents:", docError);
        return [];
    }

    // Fetch counts for each document
    const documentIds = documents.map((d) => d.id);

    // Get quiz counts per document
    const { data: quizCounts } = await supabase
        .from("quizzes")
        .select("doc_id")
        .in("doc_id", documentIds);

    // Get flashcard set counts per document
    const { data: flashcardCounts } = await supabase
        .from("flashcard_sets")
        .select("doc_id")
        .in("doc_id", documentIds);

    // Get note counts per document
    const { data: noteCounts } = await supabase
        .from("generated_notes")
        .select("doc_id")
        .in("doc_id", documentIds);

    // Count occurrences per document
    const quizCountMap = new Map<string, number>();
    const flashcardCountMap = new Map<string, number>();
    const noteCountMap = new Map<string, number>();

    (quizCounts || []).forEach((q) => {
        if (q.doc_id) {
            quizCountMap.set(q.doc_id, (quizCountMap.get(q.doc_id) || 0) + 1);
        }
    });

    (flashcardCounts || []).forEach((f) => {
        if (f.doc_id) {
            flashcardCountMap.set(f.doc_id, (flashcardCountMap.get(f.doc_id) || 0) + 1);
        }
    });

    (noteCounts || []).forEach((n) => {
        if (n.doc_id) {
            noteCountMap.set(n.doc_id, (noteCountMap.get(n.doc_id) || 0) + 1);
        }
    });

    return documents.map((doc) => ({
        id: doc.id,
        sourceLabel: doc.source_label,
        sourceType: doc.source_type,
        createdAt: doc.created_at,
        quizCount: quizCountMap.get(doc.id) || 0,
        flashcardCount: flashcardCountMap.get(doc.id) || 0,
        noteCount: noteCountMap.get(doc.id) || 0,
    }));
}

export async function deleteDocument(docId: string): Promise<void> {
    const supabase = createServerSupabaseClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Delete document (cascades to related records)
    const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", docId)
        .eq("user_id", user.id);

    if (error) {
        console.error("Failed to delete document:", error);
        throw new Error("Failed to delete document");
    }
}
