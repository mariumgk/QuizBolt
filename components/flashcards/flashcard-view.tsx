"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Flashcard } from "@/lib/mock-api/flashcards";
import { Button } from "@/components/ui/button";

interface Props {
  cards: Flashcard[];
}

export function FlashcardView({ cards }: Props) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!cards.length) {
    return (
      <p className="text-xs text-muted-foreground">No cards in this set.</p>
    );
  }

  const card = cards[index];

  const next = () => {
    setFlipped(false);
    setIndex((i) => (i + 1) % cards.length);
  };

  const prev = () => {
    setFlipped(false);
    setIndex((i) => (i - 1 + cards.length) % cards.length);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          Card {index + 1} of {cards.length}
        </span>
        <span className="capitalize">Topic: {card.topic}</span>
      </div>
      <div className="flex justify-center">
        <motion.button
          type="button"
          className="h-48 w-full max-w-sm cursor-pointer rounded-xl border bg-card p-4 text-center text-sm shadow-sm"
          onClick={() => setFlipped((f) => !f)}
          initial={false}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.4 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className="flex h-full flex-col items-center justify-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="font-medium">{card.front}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Tap to flip and reveal the answer.
            </p>
          </div>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-primary text-primary-foreground px-4"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <p className="font-medium">{card.back}</p>
          </div>
        </motion.button>
      </div>
      <div className="flex items-center justify-between text-xs">
        <Button type="button" variant="outline" onClick={prev}>
          Previous
        </Button>
        <Button type="button" variant="default" onClick={next}>
          Next
        </Button>
      </div>
    </div>
  );
}
