"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { getStudyMetrics, getRecentActivity, type StudyMetrics, type RecentActivity } from "@/app/actions/analytics";

export function AnalyticsCharts() {
  const [metrics, setMetrics] = useState<StudyMetrics | null>(null);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [metricsData, activityData] = await Promise.all([
          getStudyMetrics(),
          getRecentActivity(),
        ]);
        setMetrics(metricsData);
        setActivity(activityData);
      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const chartData = metrics?.recentScores || [];

  // Get activity type info
  const getActivityTypeInfo = (type: RecentActivity["type"]) => {
    switch (type) {
      case "document":
        return { label: "Document", href: "/chat", color: "text-blue-600" };
      case "quiz":
        return { label: "Quiz", href: "/quizzes", color: "text-purple-600" };
      case "flashcard":
        return { label: "Flashcards", href: "/flashcards", color: "text-green-600" };
      case "note":
        return { label: "Notes", href: "/notes", color: "text-orange-600" };
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-[2fr,1fr] mt-6">
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <p className="mb-3 text-sm font-medium">Quiz Score Progress</p>
        <div className="h-60">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading chart...
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Take some quizzes to see your progress here
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <p className="mb-3 text-sm font-medium">Recent Activity</p>
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : activity.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No recent activity. Start by uploading a document!
          </p>
        ) : (
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {activity.map((item) => {
              const typeInfo = getActivityTypeInfo(item.type);
              return (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={`${typeInfo.href}/${item.id}`}
                  className="block rounded-lg border p-2 text-xs hover:bg-muted transition-colors"
                >
                  <span className={`font-medium ${typeInfo.color}`}>
                    {typeInfo.label}
                  </span>
                  <p className="truncate text-foreground">{item.title}</p>
                  <p className="text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
