"use client";

import { StatsCards } from "@/components/dashboard/stats-cards";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Track your performance and quickly jump back into study sessions.
        </p>
      </div>
      <StatsCards />
      <AnalyticsCharts />
    </div>
  );
}
