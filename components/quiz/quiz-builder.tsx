"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { mockGenerateQuiz } from "@/lib/mock-api/quizzes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function QuizBuilder({ onCreated }: { onCreated: () => void }) {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questionCount, setQuestionCount] = useState(10);

  const mutation = useMutation({
    mutationFn: mockGenerateQuiz,
    onSuccess: () => {
      onCreated();
    },
  });

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4">
      <h2 className="text-sm font-semibold">Quiz builder</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1">
          <label className="text-xs font-medium">Topic</label>
          <Input
            placeholder="e.g. Linear Algebra, Cell Biology"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Difficulty</label>
          <select
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
            value={difficulty}
            onChange={(e) =>
              setDifficulty(e.target.value as "easy" | "medium" | "hard")
            }
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Number of questions</label>
          <Input
            type="number"
            min={3}
            max={50}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value) || 0)}
          />
        </div>
      </div>
      <Button
        type="button"
        onClick={() =>
          mutation.mutate({ topic: topic || "Untitled", difficulty, questionCount })
        }
        disabled={mutation.isPending}
      >
        {mutation.isPending ? "Generating with AI…" : "Generate quiz with AI"}
      </Button>
      {mutation.isSuccess && (
        <p className="text-xs text-emerald-600">
          Mock quiz generated and saved to your library.
        </p>
      )}
    </div>
  );
}
