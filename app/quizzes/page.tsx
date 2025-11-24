"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { mockGetQuizzes } from "@/lib/mock-api/quizzes";
import { QuizCard } from "@/components/quiz/quiz-card";
import { Button } from "@/components/ui/button";

export default function QuizzesPage() {
  const { data: quizzes, isLoading } = useQuery({
    queryKey: ["quizzes"],
    queryFn: mockGetQuizzes,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Quizzes</h1>
          <p className="text-sm text-muted-foreground">
            Browse and reuse your AI-generated quizzes.
          </p>
        </div>
        <Link href="/quizzes/create">
          <Button>Create new quiz</Button>
        </Link>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading quizzes…</p>
      ) : !quizzes?.length ? (
        <p className="text-sm text-muted-foreground">
          No quizzes yet. Generate one using the quiz builder.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {quizzes.map((q) => (
            <QuizCard key={q.id} quiz={q} />
          ))}
        </div>
      )}
    </div>
  );
}
