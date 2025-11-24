"use client";

import { useQuery } from "@tanstack/react-query";
import { mockGetAnalytics } from "@/lib/mock-api/analytics";
import { cn } from "@/lib/utils";

export function StatsCards() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: mockGetAnalytics,
  });

  const summary = data?.summary;

  const skeleton = (
    <div className="h-6 w-16 animate-pulse rounded bg-muted" />
  );

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatCard label="Total quizzes" value={summary?.totalQuizzes} loading={isLoading} />
      <StatCard label="Flashcards" value={summary?.totalFlashcards} loading={isLoading} />
      <StatCard label="Avg. score" value={summary?.averageScore + "%"} loading={isLoading} />
      <StatCard label="Study streak" value={summary?.studyStreakDays + " days"} loading={isLoading} />
    </div>
  );
}

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: string | number | undefined;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span className={cn("text-xl font-semibold", loading && "text-muted-foreground")}
      >
        {loading ? "…" : value}
      </span>
    </div>
  );
}
