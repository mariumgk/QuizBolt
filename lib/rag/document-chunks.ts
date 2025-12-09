/**
 * Helper functions to retrieve document chunks and build context
 * for AI-powered features (quizzes, flashcards, notes)
 */

import { createServerSupabaseClient } from "@/supabase/server";

export interface DocumentChunk {
    id: string;
    doc_id: string;
    chunk_index: number;
    start_offset: number;
    end_offset: number;
    chunk_text: string;
}

/**
 * Retrieve all chunks for a document
 */
export async function getDocumentChunks(docId: string, limit = 50): Promise<DocumentChunk[]> {
    const supabase = createServerSupabaseClient();

    const { data: chunks, error } = await supabase
        .from("document_chunks")
        .select("id, doc_id, chunk_index, start_offset, end_offset, chunk_text")
        .eq("doc_id", docId)
        .order("chunk_index")
        .limit(limit);

    if (error) {
        console.error("Failed to fetch chunks:", error);
        return [];
    }

    return chunks || [];
}

/**
 * Build context string from chunks for AI prompts
 */
export function buildContextFromChunks(chunks: DocumentChunk[]): string {
    if (!chunks.length) {
        return "";
    }

    return chunks.map((chunk) => chunk.chunk_text).join("\n\n");
}
