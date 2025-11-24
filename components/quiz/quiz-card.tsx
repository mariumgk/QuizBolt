"use client";

import { useRouter } from "next/navigation";
import type { Quiz } from "@/lib/mock-api/quizzes";

export function QuizCard({ quiz }: { quiz: Quiz }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(`/quizzes/${quiz.id}`)}
      className="flex flex-col rounded-xl border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="text-sm font-semibold">{quiz.title}</span>
      <span className="mt-1 text-xs text-muted-foreground">{quiz.topic}</span>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{quiz.questionCount} questions</span>
        <span className="capitalize">{quiz.difficulty}</span>
      </div>
      {quiz.lastAttemptScore != null && (
        <span className="mt-2 text-xs text-emerald-600">
          Last score: {quiz.lastAttemptScore}%
        </span>
      )}
    </button>
  );
}
