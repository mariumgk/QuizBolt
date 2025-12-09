"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LightbulbIcon, ArrowRightIcon, RefreshCwIcon, TrendingUpIcon, AlertCircleIcon, AwardIcon } from "lucide-react";
import Link from "next/link";
import { generateLearningInsights, type LearningInsight } from "@/app/actions/insights";
import { cn } from "@/lib/utils";

export function AIInsights() {
    const [insights, setInsights] = useState<LearningInsight[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchInsights = async () => {
        setIsLoading(true);
        try {
            const data = await generateLearningInsights();
            setInsights(data);
        } catch (error) {
            console.error("Failed to fetch insights:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInsights();
    }, []);

    const getIcon = (type: LearningInsight["type"]) => {
        switch (type) {
            case "strength": return <TrendingUpIcon className="h-5 w-5 text-green-500" />;
            case "weakness": return <AlertCircleIcon className="h-5 w-5 text-amber-500" />;
            case "milestone": return <AwardIcon className="h-5 w-5 text-purple-500" />;
            default: return <LightbulbIcon className="h-5 w-5 text-blue-500" />;
        }
    };

    const getBgColor = (type: LearningInsight["type"]) => {
        switch (type) {
            case "strength": return "bg-green-500/10 border-green-500/20";
            case "weakness": return "bg-amber-500/10 border-amber-500/20";
            case "milestone": return "bg-purple-500/10 border-purple-500/20";
            default: return "bg-blue-500/10 border-blue-500/20";
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                    <LightbulbIcon className="h-4 w-4 text-yellow-500" />
                    AI Learning Insights
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchInsights} disabled={isLoading}>
                    <RefreshCwIcon className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    <span className="sr-only">Refresh</span>
                </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                {isLoading && insights.length === 0 ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {insights.map((insight, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "relative flex flex-col justify-between rounded-lg border p-4 transition-all hover:shadow-sm",
                                    getBgColor(insight.type)
                                )}
                            >
                                <div className="flex gap-3">
                                    <div className="shrink-0 mt-0.5">{getIcon(insight.type)}</div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-tight text-foreground">
                                            {insight.type === "milestone" ? "Milestone Reached!" :
                                                insight.type === "strength" ? "Strength Identified" :
                                                    insight.type === "weakness" ? "Focus Area" : "Suggestion"}
                                        </p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {insight.message}
                                        </p>
                                    </div>
                                </div>
                                {insight.actionLabel && insight.actionUrl && (
                                    <div className="mt-4 flex justify-end">
                                        <Link href={insight.actionUrl}>
                                            <span className="text-xs font-semibold hover:underline flex items-center gap-1">
                                                {insight.actionLabel} <ArrowRightIcon className="h-3 w-3" />
                                            </span>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
