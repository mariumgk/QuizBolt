"use client";

import { motion } from "framer-motion";
import type { Flashcard } from "@/lib/mock-api/flashcards";
import { useRouter } from "next/navigation";

export function FlashcardGrid({ cards }: { cards: Flashcard[] }) {
  const router = useRouter();

  if (!cards.length) {
    return (
      <p className="text-xs text-muted-foreground">
        No flashcards yet. Create a set using the builder.
      </p>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-4">
      {cards.map((card) => (
        <motion.button
          key={card.id}
          type="button"
          whileHover={{ y: -2, boxShadow: "0 8px 20px rgba(0,0,0,0.08)" }}
          className="rounded-xl border bg-card p-3 text-left text-xs"
          onClick={() => router.push(`/flashcards/${card.id}`)}
        >
          <p className="mb-1 font-medium text-foreground truncate">
            {card.front}
          </p>
          <p className="truncate text-muted-foreground">{card.back}</p>
        </motion.button>
      ))}
    </div>
  );
}
