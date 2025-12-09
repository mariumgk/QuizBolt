"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getUserQuizzes } from "@/app/actions/generate-quiz";

interface Quiz {
  id: string;
  title: string;
  docId: string | null;
  numQuestions: number;
  createdAt: string;
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadQuizzes() {
      try {
        const data = await getUserQuizzes();
        setQuizzes(data);
      } catch (error) {
        console.error("Failed to load quizzes:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadQuizzes();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Quizzes</h1>
          <p className="text-sm text-muted-foreground">
            Browse and take your AI-generated quizzes.
          </p>
        </div>
        <Link href="/quizzes/create">
          <Button>Create new quiz</Button>
        </Link>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading quizzes...</p>
      ) : quizzes.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            No quizzes yet. Create one from your uploaded documents.
          </p>
          <Link href="/quizzes/create">
            <Button variant="outline">Create your first quiz</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <Link
              key={quiz.id}
              href={`/quizzes/${quiz.id}`}
              className="group rounded-xl border bg-card p-4 transition-colors hover:border-primary"
            >
              <h3 className="mb-1 font-medium text-foreground group-hover:text-primary">
                {quiz.title}
              </h3>
              <p className="mb-2 text-xs text-muted-foreground">
                {quiz.numQuestions} questions
              </p>
              <p className="text-xs text-muted-foreground">
                Created {new Date(quiz.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
