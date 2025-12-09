"use server";

import { OpenAI } from "openai";
import { createServerSupabaseClient } from "@/supabase/server";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface LearningInsight {
    type: "strength" | "weakness" | "milestone" | "suggestion";
    message: string;
    actionLabel?: string;
    actionUrl?: string;
}

export async function generateLearningInsights(): Promise<LearningInsight[]> {
    const supabase = createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    // Fetch succinct history for context
    const [recentAttempts, recentReviews] = await Promise.all([
        supabase
            .from("quiz_attempts")
            .select("score, quizzes(title)")
            .eq("user_id", user.id)
            .order("completed_at", { ascending: false })
            .limit(5),
        supabase
            .from("flashcard_reviews")
            .select("rating")
            .eq("user_id", user.id)
            .order("reviewed_at", { ascending: false })
            .limit(20),
    ]);

    const attemptsData = recentAttempts.data?.map(a =>
        // @ts-ignore
        `${a.quizzes?.title}: ${a.score}%`
    ).join("\n") || "No recent quizzes.";

    const reviewAvg = recentReviews.data?.length
        ? (recentReviews.data.reduce((sum, r) => sum + r.rating, 0) / recentReviews.data.length).toFixed(1)
        : "No reviews";

    const systemPrompt = `You are an AI study coach. Analyze the user's recent performance and generate 3-4 concise, actionable insights.
  Input format:
  Recent Quizzes: [List]
  Recent Flashcard Avg Rating: [number]

  Output JSON array of objects with keys: { type, message, actionLabel, actionUrl }
  types: strength, weakness, milestone, suggestion.
  Keep messages encouraging but realistic.
  actionUrl should be /quizzes, /flashcards, or /library.`;

    const userPrompt = `Recent Quizzes:\n${attemptsData}\n\nRecent Flashcard Avg Rating: ${reviewAvg}`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        if (content) {
            const parsed = JSON.parse(content);
            return parsed.insights || parsed.data || []; // Handle potential schema variations from LLM
        }
    } catch (error) {
        console.error("Failed to generate insights:", error);
    }

    // Fallback insights if AI fails or no history
    return [
        {
            type: "suggestion",
            message: "Consistency is key! Try to complete at least one quiz today.",
            actionLabel: "Start Quiz",
            actionUrl: "/quizzes",
        },
    ];
}
