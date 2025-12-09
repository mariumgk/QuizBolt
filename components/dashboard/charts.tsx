"use client";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions,
} from "chart.js";
import { Line, Bar, Pie } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const commonOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: "bottom" as const,
            labels: {
                usePointStyle: true,
                boxWidth: 8,
                padding: 20,
                font: { size: 11 },
            },
        },
        tooltip: {
            backgroundColor: "hsl(var(--popover))",
            titleColor: "hsl(var(--popover-foreground))",
            bodyColor: "hsl(var(--popover-foreground))",
            borderColor: "hsl(var(--border))",
            borderWidth: 1,
            padding: 10,
            displayColors: true,
        },
    },
    scales: {
        x: {
            grid: { display: false, drawBorder: false },
            ticks: { font: { size: 10 }, color: "hsl(var(--muted-foreground))" },
        },
        y: {
            grid: { color: "hsl(var(--border))", drawBorder: false },
            ticks: { font: { size: 10 }, color: "hsl(var(--muted-foreground))" },
            beginAtZero: true,
            max: 100,
        },
    },
};

interface ScoreHistoryProps {
    data: Array<{ date: string; score: number }>;
}

export function ScoreHistory({ data }: ScoreHistoryProps) {
    const chartData = {
        labels: data.map((d) => d.date),
        datasets: [
            {
                label: "Quiz Score",
                data: data.map((d) => d.score),
                borderColor: "hsl(var(--primary))",
                backgroundColor: "hsla(var(--primary), 0.1)",
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointBackgroundColor: "hsl(var(--background))",
                pointBorderColor: "hsl(var(--primary))",
                pointHoverBackgroundColor: "hsl(var(--primary))",
            },
        ],
    };

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Score History</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px]">
                {data.length > 0 ? (
                    <Line options={commonOptions} data={chartData} />
                ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        No quiz attempts yet
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Topic Accuracy Mock (since we don't have topic extraction yet, we use placeholder logic or mock)
// The user asked for "Accuracy by topic". My server action currently returns empty object.
// I'll update it to accept the record and show a message if empty.
interface TopicAccuracyProps {
    data: Record<string, number>;
}

export function TopicAccuracy({ data }: TopicAccuracyProps) {
    const topics = Object.keys(data);
    const chartData = {
        labels: topics,
        datasets: [
            {
                label: "Accuracy %",
                data: Object.values(data),
                backgroundColor: "hsl(var(--chart-2))",
                borderRadius: 4,
            },
        ],
    };

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Topic Accuracy</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px]">
                {topics.length > 0 ? (
                    <Bar options={commonOptions} data={chartData} />
                ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        Not enough data for topic analysis
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

interface FlashcardDistributionProps {
    data: { hard: number; medium: number; easy: number };
}

export function FlashcardDistribution({ data }: FlashcardDistributionProps) {
    const total = data.hard + data.medium + data.easy;

    const chartData = {
        labels: ["Hard", "Medium", "Easy"],
        datasets: [
            {
                data: [data.hard, data.medium, data.easy],
                backgroundColor: [
                    "hsl(var(--destructive))", // Hard - Red
                    "hsl(var(--chart-4))",     // Medium - Yellow/Orange
                    "hsl(var(--chart-3))",     // Easy - Green/Blue
                ],
                borderWidth: 0,
                hoverOffset: 4,
            },
        ],
    };

    const pieOptions: ChartOptions<any> = {
        ...commonOptions,
        scales: { x: { display: false }, y: { display: false } }, // No axes for pie
        plugins: {
            legend: { position: "right", labels: { usePointStyle: true, boxWidth: 8 } },
            tooltip: commonOptions.plugins?.tooltip,
        },
    };

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Flashcard Mastery</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px] relative">
                {total > 0 ? (
                    <Pie options={pieOptions} data={chartData} />
                ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        No flashcards reviewed
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
