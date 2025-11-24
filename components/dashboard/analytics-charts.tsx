"use client";

import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { mockGetAnalytics } from "@/lib/mock-api/analytics";

export function AnalyticsCharts() {
  const { data } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: mockGetAnalytics,
  });

  const history = data?.scoreHistory ?? [];

  return (
    <div className="grid gap-4 md:grid-cols-[2fr,1fr] mt-6">
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <p className="mb-3 text-sm font-medium">Score progress</p>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" hide />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-4 shadow-sm text-sm text-muted-foreground">
        <p className="mb-2 font-medium text-foreground">Insights</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Review recent low-scoring quizzes to reinforce weak topics.</li>
          <li>Convert missed questions into flashcards for spaced repetition.</li>
          <li>Keep your streak going with at least one quiz a day.</li>
        </ul>
      </div>
    </div>
  );
}
