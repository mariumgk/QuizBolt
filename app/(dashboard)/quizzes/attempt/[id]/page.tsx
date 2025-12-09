"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getQuizAttemptDetails, type QuizAttemptDetail } from "@/app/actions/analytics-advanced";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, CheckIcon, XIcon, ClockIcon, Download, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidePanel } from "@/components/ui/side-panel";
import { exportToPdf, exportToDocx, exportToTxt, formatQuizWithAnswersForExport } from "@/lib/export-utils";

export default function AttemptReviewPage() {
    const params = useParams();
    const attemptId = params.id as string;
    const [detail, setDetail] = useState<QuizAttemptDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showExportPanel, setShowExportPanel] = useState(false);

    useEffect(() => {
        if (!attemptId) return;
        async function load() {
            try {
                const data = await getQuizAttemptDetails(attemptId);
                setDetail(data);
            } catch (error) {
                console.error("Failed to load attempt:", error);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, [attemptId]);

    const handleExport = (type: 'pdf' | 'docx' | 'txt') => {
        if (!detail) return;
        const title = `${detail.quizTitle} - Results`;

        // Transform data for export format
        const questionsForExport = detail.answers.map(a => ({
            questionText: a.questionText,
            options: ["(See full quiz for options)"], // The attempt detail might not have all options if not stored, check data structure. 
            // AttemptDetail usually stores user answer + correct answer. 
            // The export utils expect { options: string[] }. 
            // I'll fake it or adjust usage. 
            // Ideally we need full options. If not available, we just show "Correct: X, Your: Y".
            // Let's create a specific format builder for Results.
            correctOption: 0, // Placeholder
            explanation: `Correct Answer: ${a.correctAnswer}\nYour Answer: ${a.userAnswer}\n${a.explanation || ''}`
        }));
        // Actually, the export util `formatQuizWithAnswersForExport` is designed for a full quiz key.
        // I will create a custom string builder here for results.

        let content = `QUIZ RESULTS: ${detail.quizTitle}\n`;
        content += `Score: ${detail.score}% - ${detail.score >= 70 ? "PASSED" : "FAILED"}\n`;
        content += `Date: ${new Date(detail.completedAt).toLocaleString()}\n\n`;

        detail.answers.forEach((ans, idx) => {
            content += `${idx + 1}. ${ans.questionText}\n`;
            content += `   Your Answer: ${ans.userAnswer} ${ans.isCorrect ? "(Correct)" : "(Incorrect)"}\n`;
            if (!ans.isCorrect) {
                content += `   Correct Answer: ${ans.correctAnswer}\n`;
            }
            if (ans.explanation) {
                content += `   Explanation: ${ans.explanation}\n`;
            }
            content += `\n`;
        });

        if (type === 'pdf') {
            exportToPdf(); // This prints current page.
        } else if (type === 'docx') {
            exportToDocx(title, content.replace(/\n/g, '<br/>'));
        } else {
            exportToTxt(title, content);
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading detailed report...</div>;
    if (!detail) return <div className="p-8 text-center text-red-500">Attempt not found</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-8">
            {/* Header */}
            <div className="space-y-4">
                <Link href="/quizzes/history">
                    <Button variant="ghost" size="sm">
                        <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to History
                    </Button>
                </Link>
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{detail.quizTitle}</h1>
                        <p className="text-muted-foreground flex items-center gap-2 mt-1">
                            Completed on {new Date(detail.completedAt).toLocaleString()}
                            {detail.durationSeconds > 0 && (
                                <span className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                                    <ClockIcon className="h-3 w-3" />
                                    {Math.floor(detail.durationSeconds / 60)}m {detail.durationSeconds % 60}s
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowExportPanel(true)}>
                            <Download className="mr-2 h-4 w-4" /> Export Results
                        </Button>
                        <div className="text-right">
                            <div className="text-4xl font-bold text-primary">{detail.score}%</div>
                            <Badge variant={detail.score >= 70 ? "default" : "destructive"}>
                                {detail.score >= 70 ? "PASSED" : "FAILED"}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Review Questions */}
            <div className="space-y-6">
                <h2 className="text-xl font-semibold">Detailed Review</h2>
                {detail.answers.map((ans, idx) => (
                    <Card key={idx} className={cn("border-l-4", ans.isCorrect ? "border-l-green-500" : "border-l-red-500")}>
                        <CardHeader className="pb-2">
                            <div className="flex items-start gap-4">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                                    {idx + 1}
                                </span>
                                <div className="space-y-1">
                                    <p className="font-medium text-lg leading-snug">{ans.questionText}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pl-16 space-y-4">
                            <div className="grid gap-2 sm:grid-cols-2 text-sm">
                                <div className={cn("p-3 rounded-lg border", ans.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
                                    <p className="text-xs text-muted-foreground mb-1">Your Answer</p>
                                    <p className="font-medium flex items-center gap-2">
                                        {ans.isCorrect ? <CheckIcon className="h-4 w-4 text-green-600" /> : <XIcon className="h-4 w-4 text-red-600" />}
                                        {ans.userAnswer}
                                    </p>
                                </div>
                                {!ans.isCorrect && (
                                    <div className="p-3 rounded-lg border bg-green-50 border-green-200">
                                        <p className="text-xs text-muted-foreground mb-1">Correct Answer</p>
                                        <p className="font-medium flex items-center gap-2">
                                            <CheckIcon className="h-4 w-4 text-green-600" />
                                            {ans.correctAnswer}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {ans.explanation && (
                                <div className="bg-muted/50 p-4 rounded-lg text-sm">
                                    <p className="font-semibold mb-1 text-primary">Explanation</p>
                                    <p className="text-muted-foreground">{ans.explanation}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <SidePanel
                isOpen={showExportPanel}
                onClose={() => setShowExportPanel(false)}
                title="Export Results"
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Select a format to download your quiz results.</p>
                    <div className="grid gap-2">
                        <Button variant="outline" className="justify-start" onClick={() => handleExport('pdf')}>
                            Export as PDF (Print)
                        </Button>
                        <Button variant="outline" className="justify-start" onClick={() => handleExport('docx')}>
                            Export as DOCX
                        </Button>
                        <Button variant="outline" className="justify-start" onClick={() => handleExport('txt')}>
                            Export as Text
                        </Button>
                    </div>
                </div>
            </SidePanel>
        </div>
    );
}

