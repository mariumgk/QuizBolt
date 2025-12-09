import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/supabase/server";
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    BorderStyle,
    Table,
    TableRow,
    TableCell,
    WidthType,
    PageBreak,
} from "docx";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ quizId: string }> }
) {
    try {
        const { quizId } = await params;
        const supabase = createServerSupabaseClient();

        // Authenticate user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get quiz
        const { data: quiz, error: quizError } = await supabase
            .from("quizzes")
            .select("*")
            .eq("id", quizId)
            .eq("user_id", user.id)
            .single();

        if (quizError || !quiz) {
            return NextResponse.json(
                { error: "Quiz not found" },
                { status: 404 }
            );
        }

        // Get questions
        const { data: questions, error: questionsError } = await supabase
            .from("quiz_questions")
            .select("*")
            .eq("quiz_id", quizId)
            .order("order_index");

        if (questionsError || !questions) {
            return NextResponse.json(
                { error: "Failed to fetch questions" },
                { status: 500 }
            );
        }

        // Check for includeAnswers query param
        const includeAnswers = request.nextUrl.searchParams.get("includeAnswers") === "true";

        // Generate DOCX
        const docxBuffer = await generateQuizDOCX({
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
            includeAnswers,
        });

        // Sanitize filename
        const safeTitle = quiz.title
            .replace(/[^a-zA-Z0-9\s-]/g, "")
            .replace(/\s+/g, "_")
            .substring(0, 50);

        return new Response(new Uint8Array(docxBuffer), {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "Content-Disposition": `attachment; filename="${safeTitle}.docx"`,
            },
        });
    } catch (error) {
        console.error("DOCX export error:", error);
        return NextResponse.json(
            { error: "Failed to generate DOCX" },
            { status: 500 }
        );
    }
}

interface QuizDOCXData {
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
    includeAnswers: boolean;
}

async function generateQuizDOCX(data: QuizDOCXData): Promise<Buffer> {
    const optionLetters = ["A", "B", "C", "D"];

    // Build question paragraphs
    const questionParagraphs: Paragraph[] = [];

    data.questions.forEach((q, idx) => {
        // Question number and text
        questionParagraphs.push(
            new Paragraph({
                spacing: { before: 300, after: 200 },
                children: [
                    new TextRun({
                        text: `${q.index}. ${q.question}`,
                        bold: true,
                        size: 24, // 12pt
                    }),
                ],
            })
        );

        // Options
        q.options.forEach((option, optIdx) => {
            const letter = optionLetters[optIdx] || String(optIdx + 1);
            questionParagraphs.push(
                new Paragraph({
                    spacing: { before: 80, after: 80 },
                    indent: { left: 720 }, // 0.5 inch indent
                    children: [
                        new TextRun({
                            text: `${letter}. ${option}`,
                            size: 22, // 11pt
                        }),
                    ],
                })
            );
        });

        // Add space after each question
        questionParagraphs.push(
            new Paragraph({
                spacing: { after: 200 },
                children: [],
            })
        );
    });

    // Build answer key paragraphs (if requested)
    const answerKeyParagraphs: Paragraph[] = [];

    if (data.includeAnswers) {
        // Page break before answer key
        answerKeyParagraphs.push(
            new Paragraph({
                children: [new PageBreak()],
            })
        );

        // Answer key title
        answerKeyParagraphs.push(
            new Paragraph({
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
                children: [
                    new TextRun({
                        text: "Answer Key",
                        bold: true,
                        size: 36,
                        color: "4F46E5",
                    }),
                ],
            })
        );

        // Divider line
        answerKeyParagraphs.push(
            new Paragraph({
                border: {
                    bottom: {
                        style: BorderStyle.SINGLE,
                        size: 12,
                        color: "4F46E5",
                    },
                },
                spacing: { after: 400 },
                children: [],
            })
        );

        // Answers
        data.questions.forEach((q) => {
            const correctLetter = optionLetters[q.correctIndex] || "";

            answerKeyParagraphs.push(
                new Paragraph({
                    spacing: { before: 150, after: 100 },
                    children: [
                        new TextRun({
                            text: `${q.index}. `,
                            bold: true,
                            size: 22,
                        }),
                        new TextRun({
                            text: `${correctLetter}`,
                            bold: true,
                            size: 22,
                            color: "16A34A", // Green
                        }),
                        new TextRun({
                            text: ` - ${q.correctAnswer}`,
                            size: 22,
                            color: "6B7280",
                        }),
                    ],
                })
            );

            if (q.explanation) {
                answerKeyParagraphs.push(
                    new Paragraph({
                        spacing: { before: 50, after: 150 },
                        indent: { left: 720 },
                        children: [
                            new TextRun({
                                text: "Explanation: ",
                                italics: true,
                                size: 20,
                                color: "6B7280",
                            }),
                            new TextRun({
                                text: q.explanation,
                                italics: true,
                                size: 20,
                                color: "6B7280",
                            }),
                        ],
                    })
                );
            }
        });
    }

    // Create document
    const doc = new Document({
        creator: "QuizBolt",
        title: data.title,
        description: `Quiz with ${data.totalQuestions} questions`,
        sections: [
            {
                properties: {},
                children: [
                    // Title
                    new Paragraph({
                        heading: HeadingLevel.TITLE,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 },
                        children: [
                            new TextRun({
                                text: data.title,
                                bold: true,
                                size: 48, // 24pt
                                color: "4F46E5",
                            }),
                        ],
                    }),

                    // Subtitle
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100 },
                        children: [
                            new TextRun({
                                text: "Generated via QuizBolt",
                                size: 22,
                                color: "6B7280",
                            }),
                        ],
                    }),

                    // Metadata
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 300 },
                        children: [
                            new TextRun({
                                text: `${data.totalQuestions} Questions • ${new Date(data.createdAt).toLocaleDateString()}`,
                                size: 20,
                                color: "9CA3AF",
                            }),
                        ],
                    }),

                    // Divider line (using border)
                    new Paragraph({
                        border: {
                            bottom: {
                                style: BorderStyle.SINGLE,
                                size: 18,
                                color: "4F46E5",
                            },
                        },
                        spacing: { after: 400 },
                        children: [],
                    }),

                    // Student info
                    new Paragraph({
                        spacing: { before: 200, after: 150 },
                        children: [
                            new TextRun({
                                text: "Name: ________________________________",
                                size: 22,
                            }),
                        ],
                    }),

                    new Paragraph({
                        spacing: { after: 400 },
                        children: [
                            new TextRun({
                                text: "Date: ________________________________",
                                size: 22,
                            }),
                        ],
                    }),

                    // Questions header
                    new Paragraph({
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 300, after: 300 },
                        children: [
                            new TextRun({
                                text: "Questions",
                                bold: true,
                                size: 28,
                                color: "4F46E5",
                            }),
                        ],
                    }),

                    // All questions
                    ...questionParagraphs,

                    // Answer key (if included)
                    ...answerKeyParagraphs,

                    // Footer
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 600 },
                        children: [
                            new TextRun({
                                text: "─────────────────────────────────────────────────────────────────",
                                size: 16,
                                color: "D1D5DB",
                            }),
                        ],
                    }),

                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 100 },
                        children: [
                            new TextRun({
                                text: "Generated by QuizBolt",
                                size: 18,
                                color: "9CA3AF",
                                italics: true,
                            }),
                        ],
                    }),
                ],
            },
        ],
    });

    // Generate buffer
    return await Packer.toBuffer(doc);
}
