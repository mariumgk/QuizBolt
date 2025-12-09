"use server";

import OpenAI from "openai";
import { createServerSupabaseClient } from "@/supabase/server";
import { getDocumentChunks, buildContextFromChunks } from "@/lib/rag/document-chunks";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface QuizQuestion {
    id: string;
    questionText: string;
    options: string[];
    correctOption: number;
    explanation: string;
    orderIndex: number;
}

export interface GeneratedQuiz {
    id: string;
    title: string;
    docId: string;
    questions: QuizQuestion[];
}

export async function generateQuiz(params: {
    docId: string;
    numQuestions?: number;
    difficulty?: "easy" | "medium" | "hard";
    title?: string;
}): Promise<GeneratedQuiz> {
    const { docId, numQuestions = 5, difficulty = "medium", title } = params;

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

    // Retrieve all chunks for comprehensive context
    const chunks = await getDocumentChunks(docId, 20);

    if (chunks.length === 0) {
        throw new Error("No content found in document. Please ensure the document was processed correctly.");
    }

    // Build context
    const context = buildContextFromChunks(chunks);

    // Difficulty-specific instructions
    const difficultyInstructions = {
        easy: "Create straightforward questions that test basic recall and fundamental understanding. Options should have one clearly correct answer.",
        medium: "Create questions that require understanding and application of concepts. Include some questions that require connecting multiple ideas.",
        hard: "Create challenging questions that require deep understanding, analysis, and critical thinking. Include nuanced options where distinctions are subtle.",
    };

    // Generate quiz using OpenAI
    const systemPrompt = `You are an educational quiz generator. Generate multiple-choice questions based on the provided content.

Difficulty Level: ${difficulty.toUpperCase()}
${difficultyInstructions[difficulty]}

Rules:
- Generate exactly ${numQuestions} questions
- Each question must have exactly 4 options
- Questions should test understanding at the ${difficulty} level
- Include a brief explanation for each correct answer
- Return valid JSON only, no markdown

Response format (pure JSON, no code blocks):
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}`;

    const userPrompt = `Study Material Content:
${context}

Generate ${numQuestions} ${difficulty}-level multiple-choice questions based on this content.`;

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

    // Parse JSON response
    let parsed: {
        questions: Array<{
            question: string;
            options: string[];
            correctIndex: number;
            explanation: string;
        }>
    };

    try {
        // Try to extract JSON from potential markdown code blocks
        let jsonStr = responseText;
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }
        parsed = JSON.parse(jsonStr);
    } catch {
        console.error("Failed to parse quiz JSON:", responseText);
        throw new Error("Failed to generate quiz. Please try again.");
    }

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error("Invalid quiz format received from AI");
    }

    // Generate quiz title
    const quizTitle = title || `Quiz: ${doc.source_label}`;

    // Insert quiz into database
    const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .insert({
            user_id: user.id,
            doc_id: docId,
            title: quizTitle,
            num_questions: parsed.questions.length,
        })
        .select()
        .single();

    if (quizError || !quiz) {
        console.error("Quiz insert error:", quizError);
        throw new Error("Failed to save quiz");
    }

    // Insert questions
    const questionsToInsert = parsed.questions.map((q, index) => ({
        quiz_id: quiz.id,
        question_text: q.question,
        options: q.options,
        correct_option: q.correctIndex,
        explanation: q.explanation || "",
        order_index: index,
    }));

    const { data: insertedQuestions, error: questionsError } = await supabase
        .from("quiz_questions")
        .insert(questionsToInsert)
        .select();

    if (questionsError || !insertedQuestions) {
        console.error("Questions insert error:", questionsError);
        throw new Error("Failed to save quiz questions");
    }

    // Map to return format
    const questions: QuizQuestion[] = insertedQuestions.map((q) => ({
        id: q.id,
        questionText: q.question_text,
        options: q.options as string[],
        correctOption: q.correct_option,
        explanation: q.explanation,
        orderIndex: q.order_index,
    }));

    return {
        id: quiz.id,
        title: quizTitle,
        docId,
        questions,
    };
}

export async function getQuiz(quizId: string): Promise<GeneratedQuiz | null> {
    const supabase = createServerSupabaseClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Get quiz
    const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
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
        docId: quiz.doc_id,
        questions: questions.map((q) => ({
            id: q.id,
            questionText: q.question_text,
            options: q.options as string[],
            correctOption: q.correct_option,
            explanation: q.explanation,
            orderIndex: q.order_index,
        })),
    };
}

export async function getUserQuizzes(): Promise<Array<{
    id: string;
    title: string;
    docId: string | null;
    numQuestions: number;
    createdAt: string;
}>> {
    const supabase = createServerSupabaseClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const { data: quizzes, error } = await supabase
        .from("quizzes")
        .select("id, title, doc_id, num_questions, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        // Table might not exist yet - return empty array
        console.log("Quizzes fetch note: ", error.message);
        return [];
    }

    return (quizzes || []).map((q) => ({
        id: q.id,
        title: q.title,
        docId: q.doc_id,
        numQuestions: q.num_questions,
        createdAt: q.created_at,
    }));
}
