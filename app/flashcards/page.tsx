"use client";

import { useQuery } from "@tanstack/react-query";
import { mockGetFlashcardSets } from "@/lib/mock-api/flashcards";
import { FlashcardGrid } from "@/components/flashcards/flashcard-grid";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FlashcardsPage() {
  const { data: cards, isLoading } = useQuery({
    queryKey: ["flashcards"],
    queryFn: mockGetFlashcardSets,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Flashcards</h1>
          <p className="text-sm text-muted-foreground">
            Review and test yourself with spaced-repetition-friendly flashcards.
          </p>
        </div>
        <Link href="/flashcards/create">
          <Button>Create flashcards</Button>
        </Link>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading flashcards…</p>
      ) : (
        <FlashcardGrid cards={cards ?? []} />
      )}
    </div>
  );
}
