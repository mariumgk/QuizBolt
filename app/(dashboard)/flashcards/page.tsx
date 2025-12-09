"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getUserFlashcardSets } from "@/app/actions/generate-flashcards";

interface FlashcardSet {
  id: string;
  title: string;
  docId: string | null;
  numCards: number;
  createdAt: string;
}

export default function FlashcardsPage() {
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSets() {
      try {
        const data = await getUserFlashcardSets();
        setSets(data);
      } catch (error) {
        console.error("Failed to load flashcard sets:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSets();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Flashcards</h1>
          <p className="text-sm text-muted-foreground">
            Review and test yourself with AI-generated flashcards.
          </p>
        </div>
        <Link href="/flashcards/create">
          <Button>Create flashcards</Button>
        </Link>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading flashcards...</p>
      ) : sets.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            No flashcard sets yet. Create one from your uploaded documents.
          </p>
          <Link href="/flashcards/create">
            <Button variant="outline">Create your first flashcard set</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sets.map((set) => (
            <Link
              key={set.id}
              href={`/flashcards/${set.id}`}
              className="group rounded-xl border bg-card p-4 transition-colors hover:border-primary"
            >
              <h3 className="mb-1 font-medium text-foreground group-hover:text-primary">
                {set.title}
              </h3>
              <p className="mb-2 text-xs text-muted-foreground">
                {set.numCards} cards
              </p>
              <p className="text-xs text-muted-foreground">
                Created {new Date(set.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
