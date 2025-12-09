"use server";

import { createServerSupabaseClient } from "@/supabase/server";

export interface ExportQuizData {
    id: string;
    title: string;
    totalQuestions: number;
    createdAt: string;
    questions: Array<{
        index: number;
        question: string;
        options: string[];
        correctAnswer: string;
        correctIndex: number;
        explanation: string;
    }>;
}

export async function getQuizForExport(quizId: string): Promise<ExportQuizData | null> {
    const supabase = createServerSupabaseClient();

    // Authenticate user
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return null;
    }

    // Get quiz
    const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .eq("user_id", user.id) // Ensure user owns this quiz
        .single();

    if (quizError || !quiz) {
        return null;
    }

    // Get questions
    const { data: questions, error: questionsError } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("order_index");

    if (questionsError || !questions) {
        return null;
    }

    return {
        id: quiz.id,
        title: quiz.title,
        totalQuestions: questions.length,
        createdAt: quiz.created_at,
        questions: questions.map((q, idx) => ({
            index: idx + 1,
            question: q.question_text,
            options: q.options as string[],
            correctAnswer: (q.options as string[])[q.correct_option] || "",
            correctIndex: q.correct_option,
            explanation: q.explanation || "",
        })),
    };
}
