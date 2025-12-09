import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/supabase/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

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

        // Generate PDF
        const pdfBytes = await generateQuizPDF({
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

        // Convert to standard Uint8Array for Response compatibility
        const standardUint8Array = new Uint8Array(pdfBytes);

        return new Response(
            standardUint8Array,
            {
                headers: {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": `attachment; filename="${safeTitle}.pdf"`,
                },
            }
        );
    } catch (error) {
        console.error("PDF export error:", error);
        return NextResponse.json(
            { error: "Failed to generate PDF" },
            { status: 500 }
        );
    }
}

interface QuizPDFData {
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

async function generateQuizPDF(data: QuizPDFData): Promise<Uint8Array> {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Embed fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Colors (converted to RGB)
    const primaryColor = rgb(0.31, 0.27, 0.9); // #4F46E5
    const textColor = rgb(0.12, 0.16, 0.22); // #1F2937
    const mutedColor = rgb(0.42, 0.45, 0.5); // #6B7280

    // Create first page
    let page = pdfDoc.addPage([595, 842]); // A4 size
    let yPosition = 792; // Start from top (with margin)
    const leftMargin = 50;
    const pageWidth = 595;
    const contentWidth = pageWidth - 2 * leftMargin;

    // Header - Title
    const titleSize = 28;
    yPosition -= titleSize;
    page.drawText(data.title, {
        x: leftMargin,
        y: yPosition,
        size: titleSize,
        font: helveticaBoldFont,
        color: primaryColor,
        maxWidth: contentWidth,
    });

    yPosition -= 20;

    // Subtitle
    const subtitleSize = 12;
    yPosition -= subtitleSize;
    page.drawText("Generated via QuizBolt", {
        x: pageWidth / 2 - 70,
        y: yPosition,
        size: subtitleSize,
        font: helveticaFont,
        color: mutedColor,
    });

    yPosition -= 15;

    // Metadata
    const metadataSize = 10;
    yPosition -= metadataSize;
    const metadata = `${data.totalQuestions} Questions • ${new Date(data.createdAt).toLocaleDateString()}`;
    page.drawText(metadata, {
        x: pageWidth / 2 - helveticaFont.widthOfTextAtSize(metadata, metadataSize) / 2,
        y: yPosition,
        size: metadataSize,
        font: helveticaFont,
        color: mutedColor,
    });

    yPosition -= 20;

    // Divider line
    page.drawLine({
        start: { x: leftMargin, y: yPosition },
        end: { x: pageWidth - leftMargin, y: yPosition },
        thickness: 2,
        color: primaryColor,
    });

    yPosition -= 30;

    // Student info
    const infoSize = 11;
    yPosition -= infoSize;
    page.drawText("Name: ________________________________", {
        x: leftMargin,
        y: yPosition,
        size: infoSize,
        font: helveticaFont,
        color: textColor,
    });

    yPosition -= 20;
    yPosition -= infoSize;
    page.drawText("Date: ________________________________", {
        x: leftMargin,
        y: yPosition,
        size: infoSize,
        font: helveticaFont,
        color: textColor,
    });

    yPosition -= 30;

    // Questions section title
    const sectionTitleSize = 14;
    yPosition -= sectionTitleSize;
    page.drawText("Questions", {
        x: leftMargin,
        y: yPosition,
        size: sectionTitleSize,
        font: helveticaBoldFont,
        color: primaryColor,
    });

    yPosition -= 25;

    // Helper function to wrap text
    const wrapText = (text: string, maxWidth: number, fontSize: number, font: any): string[] => {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const width = font.widthOfTextAtSize(testLine, fontSize);

            if (width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    };

    // Questions
    const questionSize = 12;
    const optionSize = 11;
    const optionLetters = ["A", "B", "C", "D"];

    for (const q of data.questions) {
        // Check if we need a new page
        if (yPosition < 150) {
            page = pdfDoc.addPage([595, 842]);
            yPosition = 792;
        }

        // Question number and text
        const questionText = `${q.index}. ${q.question}`;
        const questionLines = wrapText(questionText, contentWidth, questionSize, helveticaBoldFont);

        for (const line of questionLines) {
            yPosition -= questionSize + 2;
            page.drawText(line, {
                x: leftMargin,
                y: yPosition,
                size: questionSize,
                font: helveticaBoldFont,
                color: textColor,
            });
        }

        yPosition -= 15;

        // Options
        for (let optIdx = 0; optIdx < q.options.length; optIdx++) {
            const letter = optionLetters[optIdx] || String(optIdx + 1);
            const optionText = `    ${letter}. ${q.options[optIdx]}`;
            const optionLines = wrapText(optionText, contentWidth - 20, optionSize, helveticaFont);

            for (const line of optionLines) {
                if (yPosition < 100) {
                    page = pdfDoc.addPage([595, 842]);
                    yPosition = 792;
                }

                yPosition -= optionSize + 2;
                page.drawText(line, {
                    x: leftMargin,
                    y: yPosition,
                    size: optionSize,
                    font: helveticaFont,
                    color: textColor,
                });
            }
        }

        yPosition -= 20;
    }

    // Answer Key (if requested)
    if (data.includeAnswers) {
        page = pdfDoc.addPage([595, 842]);
        yPosition = 792;

        // Answer key header
        const answerKeySize = 20;
        yPosition -= answerKeySize;
        page.drawText("Answer Key", {
            x: pageWidth / 2 - helveticaBoldFont.widthOfTextAtSize("Answer Key", answerKeySize) / 2,
            y: yPosition,
            size: answerKeySize,
            font: helveticaBoldFont,
            color: primaryColor,
        });

        yPosition -= 20;

        // Divider
        page.drawLine({
            start: { x: leftMargin, y: yPosition },
            end: { x: pageWidth - leftMargin, y: yPosition },
            thickness: 1,
            color: primaryColor,
        });

        yPosition -= 30;

        // Answers
        const answerSize = 11;
        for (const q of data.questions) {
            if (yPosition < 100) {
                page = pdfDoc.addPage([595, 842]);
                yPosition = 792;
            }

            const correctLetter = optionLetters[q.correctIndex] || "";
            const answerText = `${q.index}. ${correctLetter} - ${q.correctAnswer}`;

            yPosition -= answerSize + 2;
            page.drawText(answerText, {
                x: leftMargin,
                y: yPosition,
                size: answerSize,
                font: helveticaFont,
                color: textColor,
                maxWidth: contentWidth,
            });

            if (q.explanation) {
                yPosition -= 5;
                const explText = `   Explanation: ${q.explanation}`;
                const explLines = wrapText(explText, contentWidth - 20, 10, helveticaFont);

                for (const line of explLines) {
                    if (yPosition < 100) {
                        page = pdfDoc.addPage([595, 842]);
                        yPosition = 792;
                    }

                    yPosition -= 12;
                    page.drawText(line, {
                        x: leftMargin,
                        y: yPosition,
                        size: 10,
                        font: helveticaFont,
                        color: mutedColor,
                    });
                }
            }

            yPosition -= 15;
        }
    }

    // Add footer to all pages
    const pages = pdfDoc.getPages();
    const footerSize = 8;
    pages.forEach((pg, i) => {
        const footerText = `QuizBolt • Page ${i + 1} of ${pages.length}`;
        pg.drawText(footerText, {
            x: pageWidth / 2 - helveticaFont.widthOfTextAtSize(footerText, footerSize) / 2,
            y: 30,
            size: footerSize,
            font: helveticaFont,
            color: mutedColor,
        });
    });

    // Serialize the PDF document to bytes
    return await pdfDoc.save();
}
