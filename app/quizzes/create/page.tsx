"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { QuizBuilder } from "@/components/quiz/quiz-builder";

export default function CreateQuizPage() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Create quiz</h1>
        <p className="text-sm text-muted-foreground">
          Configure topic, difficulty, and number of questions, then let AI
          generate a quiz for you.
        </p>
      </div>
      <QuizBuilder
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ["quizzes"] });
          router.push("/quizzes");
        }}
      />
    </div>
  );
}
