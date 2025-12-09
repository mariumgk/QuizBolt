"use server";

import { createServerSupabaseClient } from "@/supabase/server";

export interface QuizResult {
    attemptId: string;
    score: number;
    totalCorrect: number;
    totalQuestions: number;
    answers: Array<{
        questionId: string;
        selectedOption: number | null;
        correctOption: number;
        isCorrect: boolean;
        explanation: string;
    }>;
}

export async function submitQuiz(params: {
    quizId: string;
    answers: Record<string, number>; // questionId -> selected option index
    durationSeconds?: number;
}): Promise<QuizResult> {
    const { quizId, answers, durationSeconds = 0 } = params;

    const supabase = createServerSupabaseClient();

    // Authenticate user
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("Unauthorized");
    }

    // Get quiz questions
    const { data: questions, error: questionsError } = await supabase
        .from("quiz_questions")
        .select("id, question_text, options, correct_option, explanation")
        .eq("quiz_id", quizId)
        .order("order_index");

    if (questionsError || !questions || questions.length === 0) {
        throw new Error("Quiz not found");
    }

    // Create attempt record
    const { data: attempt, error: attemptError } = await supabase
        .from("quiz_attempts")
        .insert({
            user_id: user.id,
            quiz_id: quizId,
            total_questions: questions.length,
            duration_seconds: durationSeconds,
        })
        .select()
        .single();

    if (attemptError || !attempt) {
        throw new Error("Failed to create quiz attempt");
    }

    // Grade each answer
    let totalCorrect = 0;
    const gradedAnswers: Array<{
        questionId: string;
        selectedOption: number | null;
        correctOption: number;
        isCorrect: boolean;
        explanation: string;
    }> = [];

    const answersToInsert: Array<{
        attempt_id: string;
        question_id: string;
        selected_option: number | null;
        is_correct: boolean;
        user_answer: string;
        correct_answer: string;
        explanation: string;
    }> = [];

    for (const question of questions) {
        const selectedOption = answers[question.id] ?? null;
        const isCorrect = selectedOption === question.correct_option;

        if (isCorrect) {
            totalCorrect++;
        }

        // Get text representation of options
        const options = question.options as string[];
        const userAnswerText = selectedOption !== null ? options[selectedOption] : "";
        const correctAnswerText = options[question.correct_option];

        gradedAnswers.push({
            questionId: question.id,
            selectedOption,
            correctOption: question.correct_option,
            isCorrect,
            explanation: question.explanation || "",
        });

        answersToInsert.push({
            attempt_id: attempt.id,
            question_id: question.id,
            selected_option: selectedOption,
            is_correct: isCorrect,
            user_answer: userAnswerText,
            correct_answer: correctAnswerText,
            explanation: question.explanation || "",
        });
    }

    // Insert answer records
    const { error: answersInsertError } = await supabase
        .from("quiz_attempt_answers")
        .insert(answersToInsert);

    if (answersInsertError) {
        console.error("Failed to save answers:", answersInsertError);
    }

    // Calculate score
    const score = Math.round((totalCorrect / questions.length) * 100);

    // Update attempt with results
    await supabase
        .from("quiz_attempts")
        .update({
            completed_at: new Date().toISOString(),
            score,
            total_correct: totalCorrect,
        })
        .eq("id", attempt.id);

    return {
        attemptId: attempt.id,
        score,
        totalCorrect,
        totalQuestions: questions.length,
        answers: gradedAnswers,
    };
}

export async function getQuizAttempts(quizId: string): Promise<Array<{
    id: string;
    score: number;
    totalCorrect: number;
    totalQuestions: number;
    completedAt: string | null;
}>> {
    const supabase = createServerSupabaseClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { data: attempts, error } = await supabase
        .from("quiz_attempts")
        .select("id, score, total_correct, total_questions, completed_at")
        .eq("quiz_id", quizId)
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });

    if (error) {
        throw new Error("Failed to fetch attempts");
    }

    return (attempts || []).map((a) => ({
        id: a.id,
        score: a.score || 0,
        totalCorrect: a.total_correct || 0,
        totalQuestions: a.total_questions || 0,
        completedAt: a.completed_at,
    }));
}
