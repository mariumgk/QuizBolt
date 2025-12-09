"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getQuizHistory } from "@/app/actions/analytics-advanced";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, CalendarIcon, CheckCircle2Icon, XCircleIcon } from "lucide-react";

export default function QuizHistoryPage() {
    const [attempts, setAttempts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadHistory() {
            try {
                const data = await getQuizHistory();
                setAttempts(data);
            } catch (error) {
                console.error("Failed to load history:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadHistory();
    }, []);

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-8">
            <div className="flex items-center gap-4">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon">
                        <ArrowLeftIcon className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Quiz History</h1>
                    <p className="text-muted-foreground">Review your past performance.</p>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
                </div>
            ) : attempts.length === 0 ? (
                <Card className="text-center p-8">
                    <p className="text-muted-foreground mb-4">No quiz attempts yet.</p>
                    <Link href="/quizzes/create">
                        <Button>Take a Quiz</Button>
                    </Link>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {attempts.map((attempt) => (
                        <Link key={attempt.id} href={`/quizzes/attempt/${attempt.id}`}>
                            <Card className="hover:bg-muted/50 transition-colors">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "p-3 rounded-full",
                                            attempt.score >= 80 ? "bg-green-100 text-green-600" :
                                                attempt.score >= 60 ? "bg-yellow-100 text-yellow-600" :
                                                    "bg-red-100 text-red-600"
                                        )}>
                                            {attempt.score >= 60 ? <CheckCircle2Icon className="h-6 w-6" /> : <XCircleIcon className="h-6 w-6" />}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{attempt.quizTitle}</h3>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <CalendarIcon className="h-3 w-3" />
                                                {new Date(attempt.completedAt).toLocaleDateString()}
                                                <span>•</span>
                                                <span>{attempt.totalQuestions} Questions</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold">{attempt.score}%</div>
                                        <Badge variant={attempt.score >= 80 ? "default" : "secondary"}>
                                            {attempt.score >= 80 ? "Excellent" : attempt.score >= 60 ? "Good" : "Needs Practice"}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

// Utility to conditional class names (make sure to import or define if not available globally, 
// likely in lib/utils or similar)
import { cn } from "@/lib/utils";
