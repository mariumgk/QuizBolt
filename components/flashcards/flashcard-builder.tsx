"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { mockGenerateFlashcards, type Flashcard } from "@/lib/mock-api/flashcards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  onGenerated: (cards: Flashcard[]) => void;
}

export function FlashcardBuilder({ onGenerated }: Props) {
  const [topic, setTopic] = useState("");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [manualCards, setManualCards] = useState<Flashcard[]>([]);

  const aiMutation = useMutation({
    mutationFn: (t: string) => mockGenerateFlashcards(t || "Untitled topic"),
    onSuccess: (cards) => {
      onGenerated(cards);
    },
  });

  const addManual = () => {
    if (!front.trim() || !back.trim()) return;
    const card: Flashcard = {
      id: String(Date.now()),
      front: front.trim(),
      back: back.trim(),
      topic: topic || "Custom",
      createdAt: new Date().toISOString(),
    };
    const next = [...manualCards, card];
    setManualCards(next);
    onGenerated(next);
    setFront("");
    setBack("");
  };

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4">
      <h2 className="text-sm font-semibold">Flashcard builder</h2>
      <div className="grid gap-3 md:grid-cols-[2fr,1fr]">
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Topic</label>
            <Input
              placeholder="e.g. Operating Systems, Photosynthesis"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Front</label>
              <Input
                placeholder="Question or term"
                value={front}
                onChange={(e) => setFront(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Back</label>
              <Input
                placeholder="Answer or definition"
                value={back}
                onChange={(e) => setBack(e.target.value)}
              />
            </div>
          </div>
          <Button type="button" onClick={addManual}>
            Add manual flashcard
          </Button>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-xs font-medium">AI assist</p>
          <Button
            type="button"
            onClick={() => aiMutation.mutate(topic)}
            disabled={aiMutation.isPending}
          >
            {aiMutation.isPending ? "Generating with AI…" : "Generate flashcards with AI"}
          </Button>
          <p className="text-[11px] text-muted-foreground">
            This uses a mock API today. Later you can plug in a real LLM to
            generate rich flashcard sets.
          </p>
        </div>
      </div>
    </div>
  );
}
