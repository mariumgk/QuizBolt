"use server";

import { createServerSupabaseClient } from "@/supabase/server";

export interface StudyMetrics {
    totalDocuments: number;
    totalQuizzes: number;
    totalFlashcards: number;
    totalNotes: number;
    averageQuizScore: number;
    quizzesCompleted: number;
    recentScores: Array<{ date: string; score: number }>;
}

export async function getStudyMetrics(): Promise<StudyMetrics> {
    const supabase = createServerSupabaseClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return {
            totalDocuments: 0,
            totalQuizzes: 0,
            totalFlashcards: 0,
            totalNotes: 0,
            averageQuizScore: 0,
            quizzesCompleted: 0,
            recentScores: [],
        };
    }

    // Fetch counts in parallel
    const [documentsResult, quizzesResult, flashcardsResult, notesResult, attemptsResult] = await Promise.all([
        supabase
            .from("documents")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
        supabase
            .from("quizzes")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
        supabase
            .from("flashcard_sets")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
        supabase
            .from("generated_notes")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
        supabase
            .from("quiz_attempts")
            .select("id, score, completed_at")
            .eq("user_id", user.id)
            .not("completed_at", "is", null)
            .order("completed_at", { ascending: false })
            .limit(20),
    ]);

    // Calculate metrics
    const totalDocuments = documentsResult.count || 0;
    const totalQuizzes = quizzesResult.count || 0;
    const totalFlashcards = flashcardsResult.count || 0;
    const totalNotes = notesResult.count || 0;

    const attempts = attemptsResult.data || [];
    const quizzesCompleted = attempts.length;

    // Calculate average score
    const averageQuizScore = attempts.length > 0
        ? Math.round(attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length)
        : 0;

    // Format recent scores for chart
    const recentScores = attempts
        .slice(0, 10)
        .reverse()
        .map((a, index) => ({
            date: a.completed_at
                ? new Date(a.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : `Quiz ${index + 1}`,
            score: a.score || 0,
        }));

    return {
        totalDocuments,
        totalQuizzes,
        totalFlashcards,
        totalNotes,
        averageQuizScore,
        quizzesCompleted,
        recentScores,
    };
}

export interface RecentActivity {
    id: string;
    type: "document" | "quiz" | "flashcard" | "note";
    title: string;
    createdAt: string;
}

export async function getRecentActivity(): Promise<RecentActivity[]> {
    const supabase = createServerSupabaseClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    // Fetch recent items from all tables
    const [docsResult, quizzesResult, flashcardsResult, notesResult] = await Promise.all([
        supabase
            .from("documents")
            .select("id, source_label, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5),
        supabase
            .from("quizzes")
            .select("id, title, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5),
        supabase
            .from("flashcard_sets")
            .select("id, title, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5),
        supabase
            .from("generated_notes")
            .select("id, title, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5),
    ]);

    // Combine and sort by date
    const activities: RecentActivity[] = [
        ...(docsResult.data || []).map((d) => ({
            id: d.id,
            type: "document" as const,
            title: d.source_label,
            createdAt: d.created_at,
        })),
        ...(quizzesResult.data || []).map((q) => ({
            id: q.id,
            type: "quiz" as const,
            title: q.title,
            createdAt: q.created_at,
        })),
        ...(flashcardsResult.data || []).map((f) => ({
            id: f.id,
            type: "flashcard" as const,
            title: f.title,
            createdAt: f.created_at,
        })),
        ...(notesResult.data || []).map((n) => ({
            id: n.id,
            type: "note" as const,
            title: n.title,
            createdAt: n.created_at,
        })),
    ];

    // Sort by date and take top 10
    return activities
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
}
