"use client";

import { useState } from "react";
import type { Flashcard } from "@/lib/mock-api/flashcards";
import { FlashcardBuilder } from "@/components/flashcards/flashcard-builder";
import { FlashcardGrid } from "@/components/flashcards/flashcard-grid";

export default function CreateFlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[]>([]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Create flashcards</h1>
        <p className="text-sm text-muted-foreground">
          Generate flashcards with AI or add your own manually.
        </p>
      </div>
      <FlashcardBuilder onGenerated={setCards} />
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Preview</h2>
        <FlashcardGrid cards={cards} />
      </section>
    </div>
  );
}
