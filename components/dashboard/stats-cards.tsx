"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getStudyMetrics, type StudyMetrics } from "@/app/actions/analytics";

export function StatsCards() {
  const [metrics, setMetrics] = useState<StudyMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const data = await getStudyMetrics();
        setMetrics(data);
      } catch (error) {
        console.error("Failed to load metrics:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadMetrics();
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatCard
        label="Documents"
        value={metrics?.totalDocuments ?? 0}
        loading={isLoading}
      />
      <StatCard
        label="Quizzes"
        value={metrics?.totalQuizzes ?? 0}
        loading={isLoading}
      />
      <StatCard
        label="Flashcard Sets"
        value={metrics?.totalFlashcards ?? 0}
        loading={isLoading}
      />
      <StatCard
        label="Avg. Score"
        value={`${metrics?.averageQuizScore ?? 0}%`}
        loading={isLoading}
      />
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
        {loading ? "..." : value}
      </span>
    </div>
  );
}
