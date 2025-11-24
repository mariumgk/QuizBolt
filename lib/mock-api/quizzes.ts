export type QuestionType = "mcq" | "true_false" | "short_answer";

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  correctAnswer?: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface Quiz {
  id: string;
  title: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  questionCount: number;
  createdAt: string;
  lastAttemptScore?: number;
}

export const mockQuizzes: Quiz[] = [
  {
    id: "1",
    title: "Intro to Biology",
    topic: "Biology",
    difficulty: "easy",
    questionCount: 10,
    createdAt: new Date().toISOString(),
    lastAttemptScore: 82,
  },
  {
    id: "2",
    title: "Data Structures Review",
    topic: "Computer Science",
    difficulty: "medium",
    questionCount: 15,
    createdAt: new Date().toISOString(),
    lastAttemptScore: 91,
  },
];

export async function mockGetQuizzes(): Promise<Quiz[]> {
  return new Promise((resolve) => setTimeout(() => resolve(mockQuizzes), 500));
}

export async function mockGenerateQuiz(payload: {
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  questionCount: number;
}): Promise<Quiz> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const quiz: Quiz = {
        id: String(Date.now()),
        title: `${payload.topic} Quiz`,
        topic: payload.topic,
        difficulty: payload.difficulty,
        questionCount: payload.questionCount,
        createdAt: new Date().toISOString(),
      };
      resolve(quiz);
    }, 900);
  });
}
