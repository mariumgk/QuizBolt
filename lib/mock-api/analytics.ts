export interface AnalyticsSummary {
  totalQuizzes: number;
  totalFlashcards: number;
  averageScore: number;
  studyStreakDays: number;
}

export interface ScorePoint {
  date: string;
  score: number;
}

export async function mockGetAnalytics(): Promise<{
  summary: AnalyticsSummary;
  scoreHistory: ScorePoint[];
}> {
  const today = new Date();
  const scoreHistory: ScorePoint[] = Array.from({ length: 8 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (7 - i));
    return {
      date: d.toISOString().slice(0, 10),
      score: 60 + Math.round(Math.random() * 35),
    };
  });

  return new Promise((resolve) => {
    setTimeout(
      () =>
        resolve({
          summary: {
            totalQuizzes: 24,
            totalFlashcards: 120,
            averageScore: 84,
            studyStreakDays: 6,
          },
          scoreHistory,
        }),
      600,
    );
  });
}
