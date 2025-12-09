"use server";

import OpenAI from "openai";
import { createServerSupabaseClient } from "@/supabase/server";
import { getDocumentChunks, buildContextFromChunks } from "@/lib/rag/document-chunks";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface Flashcard {
    id?: string; // Optional for new cards not yet saved
    front: string;
    back: string;
    orderIndex: number;
    masteryLevel: number;
    isAiGenerated?: boolean; // Track source
}

export interface FlashcardSet {
    id: string;
    title: string;
    docId: string | null;
    numCards: number;
    createdAt: string;
    cards: Flashcard[];
}

// Helper to generate content only
async function generateFlashcardsContent(docId: string, numCards: number): Promise<Array<{ front: string; back: string }>> {
    const supabase = createServerSupabaseClient();

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
    const chunks = await getDocumentChunks(docId, 20);

    if (chunks.length === 0) {
        throw new Error("No content found in document");
    }

    // Build context
    const context = buildContextFromChunks(chunks);

    const systemPrompt = `You are an educational flashcard generator. Create flashcards that help with learning and memorization.

Rules:
- Generate exactly ${numCards} flashcards
- Front should be a question, term, or concept
- Back should be a clear, concise answer or definition
- Focus on key concepts, definitions, and important facts
- Return valid JSON only, no markdown

Response format (pure JSON, no code blocks):
{
  "flashcards": [
    {
      "front": "What is [concept]?",
      "back": "Clear explanation or definition"
    }
  ]
}`;

    const userPrompt = `Study Material Content:
${context}

Generate ${numCards} flashcards from this content.`;

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content ?? "";

    let parsed: { flashcards: Array<{ front: string; back: string }> };

    try {
        let jsonStr = responseText;
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }
        parsed = JSON.parse(jsonStr);
    } catch {
        console.error("Failed to parse flashcards JSON:", responseText);
        throw new Error("Failed to generate flashcards. Please try again.");
    }

    if (!parsed.flashcards || !Array.isArray(parsed.flashcards)) {
        throw new Error("Invalid flashcard format received from AI");
    }

    return parsed.flashcards;
}

export async function previewGeneratedFlashcards(params: {
    docId: string;
    numCards?: number;
}): Promise<Array<{ front: string; back: string; isAiGenerated: boolean }>> {
    const { docId, numCards = 10 } = params;
    const cards = await generateFlashcardsContent(docId, numCards);
    return cards.map(c => ({ ...c, isAiGenerated: true }));
}

export async function saveFlashcardSet(params: {
    title: string;
    docId?: string;
    cards: Array<{ front: string; back: string; masteryLevel?: number }>;
}): Promise<string> { // Returns Set ID
    const { title, docId, cards } = params;
    const supabase = createServerSupabaseClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) throw new Error("Unauthorized");

    // Insert Set
    const { data: set, error: setError } = await supabase
        .from("flashcard_sets")
        .insert({
            user_id: user.id,
            doc_id: docId || null,
            title: title,
            num_cards: cards.length,
        })
        .select()
        .single();

    if (setError || !set) throw new Error("Failed to create flashcard set");

    // Insert Cards
    const cardsToInsert = cards.map((card, index) => ({
        set_id: set.id,
        front: card.front,
        back: card.back,
        order_index: index,
        mastery_level: card.masteryLevel || 0,
    }));

    const { error: cardsError } = await supabase
        .from("flashcards")
        .insert(cardsToInsert);

    if (cardsError) throw new Error("Failed to save flashcards");

    return set.id;
}

// Keep original function for backward compatibility but use refactored logic
export async function generateFlashcards(params: {
    docId: string;
    numCards?: number;
    title?: string;
}): Promise<FlashcardSet> {
    const { docId, numCards = 10, title } = params;

    const supabase = createServerSupabaseClient();
    const { data: doc } = await supabase
        .from("documents")
        .select("source_label")
        .eq("id", docId)
        .single();

    const generatedCards = await generateFlashcardsContent(docId, numCards);

    const setTitle = title || `Flashcards: ${doc?.source_label || 'Generated'}`;

    const setId = await saveFlashcardSet({
        title: setTitle,
        docId,
        cards: generatedCards
    });

    return (await getFlashcardSet(setId))!;
}

export async function getFlashcardSet(setId: string): Promise<FlashcardSet | null> {
    const supabase = createServerSupabaseClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Get set
    const { data: set, error: setError } = await supabase
        .from("flashcard_sets")
        .select("*")
        .eq("id", setId)
        .single();

    if (setError || !set) {
        return null;
    }

    // Get cards
    const { data: cards, error: cardsError } = await supabase
        .from("flashcards")
        .select("*")
        .eq("set_id", setId)
        .order("order_index");

    if (cardsError || !cards) {
        return null;
    }

    return {
        id: set.id,
        title: set.title,
        docId: set.doc_id,
        numCards: set.num_cards,
        createdAt: set.created_at,
        cards: cards.map((c) => ({
            id: c.id,
            front: c.front,
            back: c.back,
            orderIndex: c.order_index,
            masteryLevel: c.mastery_level,
        })),
    };
}

export async function getUserFlashcardSets(): Promise<Array<{
    id: string;
    title: string;
    docId: string | null;
    numCards: number;
    createdAt: string;
}>> {
    const supabase = createServerSupabaseClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { data: sets, error } = await supabase
        .from("flashcard_sets")
        .select("id, title, doc_id, num_cards, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        // Table might not exist yet - return empty array
        console.log("Flashcard sets fetch note: ", error.message);
        return [];
    }

    return (sets || []).map((s) => ({
        id: s.id,
        title: s.title,
        docId: s.doc_id,
        numCards: s.num_cards,
        createdAt: s.created_at,
    }));
}

export async function updateCardMastery(params: {
    cardId: string;
    masteryLevel: number;
}): Promise<void> {
    const { cardId, masteryLevel } = params;

    const supabase = createServerSupabaseClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { error } = await supabase
        .from("flashcards")
        .update({ mastery_level: Math.min(5, Math.max(0, masteryLevel)) })
        .eq("id", cardId);

    if (error) {
        throw new Error("Failed to update mastery");
    }
}

export async function getFlashcardSetsWithStats(): Promise<Array<{
    id: string;
    title: string;
    totalCards: number;
    masteredCards: number; // mastery_level >= 4
    learningCards: number; // mastery_level < 4
    lastReviewedAt: string | null;
}>> {
    const supabase = createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    // Fetch sets with cards to calculate mastery
    // Note: This might be heavy if many sets. Optimization would be SQL view or join.
    // For now, fetching relations is okay.
    const { data: sets } = await supabase
        .from("flashcard_sets")
        .select("id, title, flashcards(mastery_level)")
        .eq("user_id", user.id);

    return (sets || []).map((s: any) => {
        const cards = s.flashcards || [];
        const mastered = cards.filter((c: any) => c.mastery_level >= 4).length;

        return {
            id: s.id,
            title: s.title,
            totalCards: cards.length,
            masteredCards: mastered,
            learningCards: cards.length - mastered,
            lastReviewedAt: null,
        };
    });
}
