"use server";

import { createServerSupabaseClient } from "@/supabase/server";

export interface UserStudyStats {
    totalQuizzes: number;
    totalFlashcardsReviewed: number;
    averageScore: number;
    studyStreakDays: number;
    totalDocuments: number;
    accuracyByTopic: Record<string, number>; // topic -> percentage
    flashcardDifficultyDist: {
        hard: number; // rating 1-2
        medium: number; // rating 3
        easy: number; // rating 4-5
    };
    scoreHistory: Array<{ date: string; score: number }>;
}

export async function getUserStudyStats(): Promise<UserStudyStats> {
    const supabase = createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return getEmptyStats();

    // Parallel fetch for dashboard data
    const [attemptsResult, reviewsResult, documentsResult] = await Promise.all([
        supabase
            .from("quiz_attempts")
            .select("score, completed_at")
            .eq("user_id", user.id)
            .not("completed_at", "is", null)
            .order("completed_at", { ascending: true }),
        supabase
            .from("flashcard_reviews")
            .select("rating, reviewed_at")
            .eq("user_id", user.id),
        supabase
            .from("documents")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
    ]);

    const attempts = attemptsResult.data || [];
    const reviews = reviewsResult.data || [];
    const totalDocuments = documentsResult.count || 0;

    // Calculate Average Score & History
    const totalQuizzes = attempts.length;
    const averageScore = totalQuizzes > 0
        ? Math.round(attempts.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalQuizzes)
        : 0;

    const scoreHistory = attempts.map((a) => ({
        date: new Date(a.completed_at).toLocaleDateString(),
        score: a.score || 0,
    }));

    // Calculate Flashcard Stats
    const flashcardDifficultyDist = {
        hard: reviews.filter((r) => r.rating <= 2).length,
        medium: reviews.filter((r) => r.rating === 3).length,
        easy: reviews.filter((r) => r.rating >= 4).length,
    };

    // Calculate Study Streak (simplified: consecutive days with activity)
    // Merge dates from quizzes and reviews
    const activityDates = new Set([
        ...attempts.map((a) => new Date(a.completed_at).toDateString()),
        ...reviews.map((r) => new Date(r.reviewed_at).toDateString()),
    ]);
    const sortedDates = Array.from(activityDates)
        .map((d) => new Date(d))
        .sort((a, b) => b.getTime() - a.getTime()); // Newest first

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if active today or yesterday to start streak
    if (sortedDates.length > 0) {
        const lastActive = sortedDates[0];
        lastActive.setHours(0, 0, 0, 0);
        const diffDays = (today.getTime() - lastActive.getTime()) / (1000 * 3600 * 24);

        if (diffDays <= 1) {
            currentStreak = 1;
            let prevDate = lastActive;

            for (let i = 1; i < sortedDates.length; i++) {
                const currentDate = sortedDates[i];
                currentDate.setHours(0, 0, 0, 0);
                const dayDiff = (prevDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24);

                if (dayDiff === 1) {
                    currentStreak++;
                    prevDate = currentDate;
                } else {
                    break;
                }
            }
        }
    }

    return {
        totalQuizzes,
        totalFlashcardsReviewed: reviews.length,
        averageScore,
        studyStreakDays: currentStreak,
        totalDocuments,
        accuracyByTopic: {}, // Placeholder: topic extraction requires joining with questions/docs
        flashcardDifficultyDist,
        scoreHistory,
    };
}

function getEmptyStats(): UserStudyStats {
    return {
        totalQuizzes: 0,
        totalFlashcardsReviewed: 0,
        averageScore: 0,
        studyStreakDays: 0,
        totalDocuments: 0,
        accuracyByTopic: {},
        flashcardDifficultyDist: { hard: 0, medium: 0, easy: 0 },
        scoreHistory: [],
    };
}

export async function recordFlashcardReview(params: {
    flashcardId: string;
    rating: number;
}) {
    const supabase = createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    await supabase.from("flashcard_reviews").insert({
        user_id: user.id,
        flashcard_id: params.flashcardId,
        rating: params.rating,
    });

    const { data: card } = await supabase
        .from("flashcards")
        .select("mastery_level")
        .eq("id", params.flashcardId)
        .single();

    if (card) {
        let newLevel = card.mastery_level || 0;
        if (params.rating >= 4) newLevel = Math.min(newLevel + 1, 5);
        else if (params.rating <= 2) newLevel = Math.max(newLevel - 1, 0);

        await supabase
            .from("flashcards")
            .update({ mastery_level: newLevel })
            .eq("id", params.flashcardId);
    }
}

export interface QuizAttemptDetail {
    id: string;
    quizTitle: string;
    score: number;
    completedAt: string;
    durationSeconds: number;
    totalQuestions: number;
    answers: Array<{
        questionText: string;
        userAnswer: string;
        correctAnswer: string;
        isCorrect: boolean;
        explanation: string;
    }>;
}

export async function getQuizAttemptDetails(attemptId: string): Promise<QuizAttemptDetail | null> {
    const supabase = createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: attempt } = await supabase
        .from("quiz_attempts")
        .select(`
      id, score, completed_at, duration_seconds, total_questions,
      quizzes (title),
      quiz_attempt_answers (
        user_answer, correct_answer, is_correct, explanation,
        quiz_questions (question_text)
      )
    `)
        .eq("id", attemptId)
        .eq("user_id", user.id)
        .single();

    if (!attempt) return null;

    // Transform data
    // @ts-ignore - Supabase types join inference can be tricky
    const answers = attempt.quiz_attempt_answers.map((a: any) => ({
        questionText: a.quiz_questions?.question_text || "Question deleted",
        userAnswer: a.user_answer,
        correctAnswer: a.correct_answer,
        isCorrect: a.is_correct,
        explanation: a.explanation,
    }));

    return {
        id: attempt.id,
        // @ts-ignore
        quizTitle: attempt.quizzes?.title || "Unknown Quiz",
        score: attempt.score,
        completedAt: attempt.completed_at,
        durationSeconds: attempt.duration_seconds || 0,
        totalQuestions: attempt.total_questions,
        answers,
    };
}

export async function getQuizHistory(): Promise<Array<{
    id: string;
    quizTitle: string;
    score: number;
    totalQuestions: number;
    completedAt: string;
}>> {
    const supabase = createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: attempts } = await supabase
        .from("quiz_attempts")
        .select("id, score, total_questions, completed_at, quizzes(title)")
        .eq("user_id", user.id)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false });

    return (attempts || []).map((a) => ({
        id: a.id,
        // @ts-ignore
        quizTitle: a.quizzes?.title || "Untitled Quiz",
        score: a.score || 0,
        totalQuestions: a.total_questions || 0,
        completedAt: a.completed_at,
    }));
}
