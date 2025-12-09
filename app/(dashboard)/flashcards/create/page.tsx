"use client";

import { FlashcardBuilder } from "@/components/flashcards/flashcard-builder";

export default function CreateFlashcardsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Create Flashcards</h1>
        <p className="text-sm text-muted-foreground">
          Generate AI-powered flashcards from your documents.
        </p>
      </div>
      <FlashcardBuilder />
    </div>
  );
}
