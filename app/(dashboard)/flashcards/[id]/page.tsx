"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getFlashcardSet, updateCardMastery, type Flashcard } from "@/app/actions/generate-flashcards";

export default function FlashcardStudyPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const setId = params?.id;

  const [set, setSet] = useState<{
    id: string;
    title: string;
    cards: Flashcard[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    async function loadSet() {
      if (!setId) return;

      try {
        const data = await getFlashcardSet(setId);
        if (data) {
          setSet(data);
        }
      } catch (err) {
        console.error("Failed to load flashcard set:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSet();
  }, [setId]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (set && currentIndex < set.cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleMastery = async (known: boolean) => {
    if (!set) return;

    const card = set.cards[currentIndex];
    if (!card.id) return; // Add null check for card ID

    const newLevel = known
      ? Math.min(5, card.masteryLevel + 1)
      : Math.max(0, card.masteryLevel - 1);

    try {
      await updateCardMastery({ cardId: card.id, masteryLevel: newLevel });

      // Update local state
      setSet({
        ...set,
        cards: set.cards.map((c, i) =>
          i === currentIndex ? { ...c, masteryLevel: newLevel } : c
        ),
      });
    } catch (err) {
      console.error("Failed to update mastery:", err);
    }

    handleNext();
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading flashcards...</p>;
  }

  if (!set || set.cards.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">No flashcards found.</p>
        <Button variant="outline" onClick={() => router.push("/flashcards")}>
          Back to Flashcards
        </Button>
      </div>
    );
  }

  const currentCard = set.cards[currentIndex];
  const progress = ((currentIndex + 1) / set.cards.length) * 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">{set.title}</h1>
          <p className="text-sm text-muted-foreground">
            Card {currentIndex + 1} of {set.cards.length}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/flashcards")}>
          Exit Study
        </Button>
      </div>

      {/* Progress bar */}
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Flashcard */}
      <div
        onClick={handleFlip}
        className="relative mx-auto h-64 w-full max-w-md cursor-pointer"
      >
        <div
          className={`absolute inset-0 flex items-center justify-center rounded-xl border bg-card p-6 text-center transition-all duration-300 ${isFlipped ? "opacity-0 -rotate-y-180" : "opacity-100"
            }`}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Question</p>
            <p className="text-lg font-medium">{currentCard.front}</p>
            <p className="mt-4 text-xs text-muted-foreground">Click to flip</p>
          </div>
        </div>
        <div
          className={`absolute inset-0 flex items-center justify-center rounded-xl border bg-primary/5 p-6 text-center transition-all duration-300 ${isFlipped ? "opacity-100" : "opacity-0 rotate-y-180"
            }`}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Answer</p>
            <p className="text-lg">{currentCard.back}</p>
            <p className="mt-4 text-xs text-muted-foreground">Click to flip back</p>
          </div>
        </div>
      </div>

      {/* Mastery indicator */}
      <div className="flex items-center justify-center gap-1">
        {[0, 1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-2 w-8 rounded ${level <= currentCard.masteryLevel ? "bg-primary" : "bg-muted"
              }`}
          />
        ))}
        <span className="ml-2 text-xs text-muted-foreground">
          Mastery: {currentCard.masteryLevel}/5
        </span>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          Previous
        </Button>

        {isFlipped && (
          <>
            <Button
              variant="outline"
              onClick={() => handleMastery(false)}
              className="border-red-500 text-red-500 hover:bg-red-50"
            >
              Needs Review
            </Button>
            <Button
              variant="outline"
              onClick={() => handleMastery(true)}
              className="border-green-500 text-green-500 hover:bg-green-50"
            >
              Got It
            </Button>
          </>
        )}

        <Button
          variant="outline"
          onClick={handleNext}
          disabled={currentIndex === set.cards.length - 1}
        >
          Next
        </Button>
      </div>

      {/* Completion */}
      {currentIndex === set.cards.length - 1 && isFlipped && (
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="mb-4 text-lg font-medium">Study session complete!</p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => {
              setCurrentIndex(0);
              setIsFlipped(false);
            }}>
              Start Over
            </Button>
            <Button onClick={() => router.push("/flashcards")}>
              Back to Flashcards
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
