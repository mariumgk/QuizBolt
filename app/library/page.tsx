"use client";

import { useQuery } from "@tanstack/react-query";
import { mockGetQuizzes } from "@/lib/mock-api/quizzes";
import { mockGetFlashcardSets } from "@/lib/mock-api/flashcards";
import { QuizCard } from "@/components/quiz/quiz-card";

export default function LibraryPage() {
  const { data: quizzes } = useQuery({
    queryKey: ["quizzes"],
    queryFn: mockGetQuizzes,
  });
  const { data: flashcards } = useQuery({
    queryKey: ["flashcards"],
    queryFn: mockGetFlashcardSets,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Library</h1>
        <p className="text-sm text-muted-foreground">
          All your saved quizzes and flashcards in one place.
        </p>
      </div>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Quizzes</h2>
        {!quizzes?.length ? (
          <p className="text-xs text-muted-foreground">No quizzes yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {quizzes.map((q) => (
              <QuizCard key={q.id} quiz={q} />
            ))}
          </div>
        )}
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Flashcards</h2>
        {!flashcards?.length ? (
          <p className="text-xs text-muted-foreground">No flashcards yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-4">
            {flashcards.map((f) => (
              <div
                key={f.id}
                className="rounded-xl border bg-card p-3 text-xs text-muted-foreground"
              >
                <p className="mb-1 font-medium text-foreground truncate">
                  {f.front}
                </p>
                <p className="truncate">{f.back}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
