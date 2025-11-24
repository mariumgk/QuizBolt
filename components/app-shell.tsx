"use client";

import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { ThemeWatcher } from "@/components/theme-watcher";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <ThemeWatcher />
      <Sidebar />
      <div className="app-main">
        <Navbar />
        <main className="flex-1 bg-muted/40 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
