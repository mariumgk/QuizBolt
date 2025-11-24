"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { mockGetFlashcardSets } from "@/lib/mock-api/flashcards";
import { FlashcardView } from "@/components/flashcards/flashcard-view";

export default function FlashcardDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data: cards, isLoading } = useQuery({
    queryKey: ["flashcards"],
    queryFn: mockGetFlashcardSets,
  });

  const singleSet = useMemo(() => {
    if (!cards || !id) return [];
    // In this mock we dont have sets, so just pick the card by id and
    // pretend its its own small set.
    const found = cards.find((c) => c.id === id);
    return found ? [found] : [];
  }, [cards, id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Flashcard viewer</h1>
        <p className="text-sm text-muted-foreground">
          Flip cards to test your recall.
        </p>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading flashcards…</p>
      ) : (
        <FlashcardView cards={singleSet} />
      )}
    </div>
  );
}
