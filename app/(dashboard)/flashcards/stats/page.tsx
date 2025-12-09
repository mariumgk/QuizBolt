"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFlashcardSetsWithStats } from "@/app/actions/generate-flashcards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeftIcon, BrainIcon, SparklesIcon } from "lucide-react";

export default function FlashcardStatsPage() {
    const [sets, setSets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await getFlashcardSetsWithStats();
                setSets(data);
            } catch (error) {
                console.error("Failed to load flashcard stats:", error);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

    const setsToRevisit = sets.filter(s => s.masteredCards < s.totalCards && s.totalCards > 0);

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-8">
            <div className="flex items-center gap-4">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon">
                        <ArrowLeftIcon className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Flashcard Statistics</h1>
                    <p className="text-muted-foreground">Track your mastery of study sets.</p>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
                </div>
            ) : sets.length === 0 ? (
                <Card className="text-center p-8">
                    <p className="text-muted-foreground mb-4">No flashcard sets created yet.</p>
                    <Link href="/flashcards/create">
                        <Button>Create Flashcards</Button>
                    </Link>
                </Card>
            ) : (
                <div className="space-y-8">
                    <section>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <SparklesIcon className="h-4 w-4 text-purple-500" />
                            Recommended for Review
                        </h2>
                        {setsToRevisit.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                {setsToRevisit.map(set => (
                                    <Link key={set.id} href={`/flashcards/${set.id}`}>
                                        <Card className="hover:border-purple-200 hover:bg-purple-50/50 transition-colors">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base">{set.title}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-xs text-muted-foreground">
                                                        <span>{set.masteredCards} / {set.totalCards} Mastered</span>
                                                        <span className="font-medium text-purple-600">Review Now</span>
                                                    </div>
                                                    <Progress value={(set.masteredCards / set.totalCards) * 100} className="h-2" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">You've mastered all your sets! Great job!</p>
                        )}
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <BrainIcon className="h-4 w-4 text-blue-500" />
                            All Sets
                        </h2>
                        <div className="space-y-3">
                            {sets.map(set => (
                                <div key={set.id} className="flex items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                                    <div className="space-y-1">
                                        <p className="font-medium">{set.title}</p>
                                        <p className="text-xs text-muted-foreground">{set.totalCards} Cards</p>
                                    </div>
                                    <div className="flex items-center gap-4 w-1/3">
                                        <div className="flex-1">
                                            <Progress value={(set.masteredCards / set.totalCards) * 100} className="h-2" />
                                        </div>
                                        <span className="text-xs font-mono font-medium min-w-[3rem] text-right">
                                            {Math.round((set.masteredCards / set.totalCards) * 100)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
