"use server";

import OpenAI from "openai";
import { createServerSupabaseClient } from "@/supabase/server";
import { getDocumentChunks, buildContextFromChunks } from "@/lib/rag/document-chunks";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface GeneratedNote {
    id: string;
    title: string;
    docId: string | null;
    content: string;
    style: "outline" | "summary" | "detailed";
    createdAt: string;
    updatedAt: string;
}

export async function generateNotes(params: {
    docId: string;
    style?: "outline" | "summary" | "detailed";
    title?: string;
}): Promise<GeneratedNote> {
    const { docId, style = "summary", title } = params;

    const supabase = createServerSupabaseClient();

    // Authenticate user
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("Unauthorized");
    }

    // Get document info
    const { data: doc, error: docError } = await supabase
        .from("documents")
        .select("id, source_label")
        .eq("id", docId)
        .single();

    if (docError || !doc) {
        throw new Error("Document not found");
    }

    // Retrieve chunks for context
    const chunks = await getDocumentChunks(docId, 30); // Get more chunks for comprehensive notes

    if (chunks.length === 0) {
        throw new Error("No content found in document");
    }

    // Build context
    const context = buildContextFromChunks(chunks);

    // Style-specific prompts
    const stylePrompts = {
        outline: "Create a structured outline with main topics and subtopics using bullet points and numbered lists.",
        summary: "Create a concise summary highlighting key points, main ideas, and important takeaways.",
        detailed: "Create comprehensive study notes covering all topics in depth with examples and explanations.",
    };

    // Generate notes using OpenAI
    const systemPrompt = `You are an expert study notes generator. Create well-organized, educational notes in Markdown format.

Style: ${style}
${stylePrompts[style]}

Format guidelines:
- Use proper Markdown formatting (headers, lists, bold, etc.)
- Organize content logically
- Highlight key terms and concepts
- Keep language clear and easy to understand
- Do not include code blocks around the entire response`;

    const userPrompt = `Study Material Content:
${context}

Generate ${style} notes from this content in Markdown format.`;

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
    });

    const notesContent = completion.choices[0]?.message?.content ?? "";

    if (!notesContent.trim()) {
        throw new Error("Failed to generate notes. Please try again.");
    }

    // Generate title
    const noteTitle = title || `Notes: ${doc.source_label}`;

    // Insert notes into database
    const { data: note, error: noteError } = await supabase
        .from("generated_notes")
        .insert({
            user_id: user.id,
            doc_id: docId,
            title: noteTitle,
            content: notesContent,
            style,
        })
        .select()
        .single();

    if (noteError || !note) {
        console.error("Notes insert error:", noteError);
        throw new Error("Failed to save notes");
    }

    return {
        id: note.id,
        title: noteTitle,
        docId,
        content: notesContent,
        style: note.style as "outline" | "summary" | "detailed",
        createdAt: note.created_at,
        updatedAt: note.updated_at,
    };
}

export async function getNote(noteId: string): Promise<GeneratedNote | null> {
    const supabase = createServerSupabaseClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { data: note, error } = await supabase
        .from("generated_notes")
        .select("*")
        .eq("id", noteId)
        .single();

    if (error || !note) {
        return null;
    }

    return {
        id: note.id,
        title: note.title,
        docId: note.doc_id,
        content: note.content,
        style: note.style as "outline" | "summary" | "detailed",
        createdAt: note.created_at,
        updatedAt: note.updated_at,
    };
}

export async function getDocumentNotes(docId: string): Promise<GeneratedNote[]> {
    const supabase = createServerSupabaseClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { data: notes, error } = await supabase
        .from("generated_notes")
        .select("*")
        .eq("doc_id", docId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error("Failed to fetch notes");
    }

    return (notes || []).map((n) => ({
        id: n.id,
        title: n.title,
        docId: n.doc_id,
        content: n.content,
        style: n.style as "outline" | "summary" | "detailed",
        createdAt: n.created_at,
        updatedAt: n.updated_at,
    }));
}

export async function getUserNotes(): Promise<Array<{
    id: string;
    title: string;
    docId: string | null;
    style: string;
    createdAt: string;
}>> {
    const supabase = createServerSupabaseClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { data: notes, error } = await supabase
        .from("generated_notes")
        .select("id, title, doc_id, style, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        // Table might not exist yet - return empty array
        console.log("Notes fetch note: ", error.message);
        return [];
    }

    return (notes || []).map((n) => ({
        id: n.id,
        title: n.title,
        docId: n.doc_id,
        style: n.style,
        createdAt: n.created_at,
    }));
}

export async function updateNote(params: {
    noteId: string;
    content: string;
}): Promise<void> {
    const { noteId, content } = params;

    const supabase = createServerSupabaseClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { error } = await supabase
        .from("generated_notes")
        .update({ content })
        .eq("id", noteId);

    if (error) {
        throw new Error("Failed to update notes");
    }
}

export async function deleteNote(noteId: string): Promise<void> {
    const supabase = createServerSupabaseClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { error } = await supabase
        .from("generated_notes")
        .delete()
        .eq("id", noteId);

    if (error) {
        throw new Error("Failed to delete notes");
    }
}
