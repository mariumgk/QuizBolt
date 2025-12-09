"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateQuiz } from "@/app/actions/generate-quiz";
import { createBrowserClient } from "@supabase/ssr";

interface Document {
  id: string;
  source_label: string;
}

export function QuizBuilder({ onCreated }: { onCreated?: (quizId: string) => void }) {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's documents
  useEffect(() => {
    async function fetchDocuments() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data, error } = await supabase
          .from("documents")
          .select("id, source_label")
          .order("created_at", { ascending: false });

        if (!error && data) {
          setDocuments(data);
          if (data.length > 0) {
            setSelectedDocId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch documents:", err);
      } finally {
        setIsLoadingDocs(false);
      }
    }

    fetchDocuments();
  }, []);

  const handleGenerate = async () => {
    if (!selectedDocId) {
      setError("Please select a document");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const quiz = await generateQuiz({
        docId: selectedDocId,
        numQuestions: questionCount,
        difficulty,
      });

      if (onCreated) {
        onCreated(quiz.id);
      } else {
        router.push(`/quizzes/${quiz.id}`);
      }
    } catch (err) {
      console.error("Quiz generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate quiz");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4">
      <h2 className="text-sm font-semibold">Quiz Builder</h2>

      {isLoadingDocs ? (
        <p className="text-sm text-muted-foreground">Loading documents...</p>
      ) : documents.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          <p>No documents found. Please upload a document first.</p>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => router.push("/upload")}
          >
            Go to Upload
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Select Document</label>
              <select
                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
              >
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.source_label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Difficulty</label>
              <select
                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Number of Questions</label>
              <Input
                type="number"
                min={3}
                max={20}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value) || 5)}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading || !selectedDocId}
          >
            {isLoading ? "Generating quiz..." : "Generate Quiz"}
          </Button>
        </>
      )}
    </div>
  );
}
