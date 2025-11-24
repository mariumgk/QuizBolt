export interface Flashcard {
  id: string;
  front: string;
  back: string;
  topic: string;
  createdAt: string;
}

export const mockFlashcards: Flashcard[] = [
  {
    id: "1",
    front: "What is Big O notation?",
    back: "A way to describe the performance or complexity of an algorithm.",
    topic: "Algorithms",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    front: "Mitochondria are the ___ of the cell.",
    back: "powerhouse",
    topic: "Biology",
    createdAt: new Date().toISOString(),
  },
];

export async function mockGetFlashcardSets(): Promise<Flashcard[]> {
  return new Promise((resolve) => setTimeout(() => resolve(mockFlashcards), 500));
}

export async function mockGenerateFlashcards(topic: string): Promise<Flashcard[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const now = new Date().toISOString();
      resolve([
        {
          id: String(Date.now()),
          front: `Key concept in ${topic}?`,
          back: `AI-generated explanation for ${topic}.`,
          topic,
          createdAt: now,
        },
      ]);
    }, 900);
  });
}
