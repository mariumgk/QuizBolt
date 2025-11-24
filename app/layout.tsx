import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "QuizBolt – AI-powered study platform",
  description: "Upload, quiz, chat, and master your study materials with AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
