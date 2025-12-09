# Layer 3: Analytics Documentation

## Overview

Layer 3 tracks user interactions with learning content to provide insights into learning progress, retention, and engagement. The analytics system powers the dashboard with actionable metrics.

## Analytics Components

1. **Quiz Attempts Tracking** - Record quiz performance
2. **Flashcard Review Tracking** - Track spaced repetition progress  
3. **Learning Insights Engine** - Generate personalized recommendations
4. **Dashboard Metrics** - Aggregate statistics and visualizations

---

## 1. Quiz Attempts Tracking

### Database Schema

\`\`\`sql
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  score NUMERIC, -- Percentage score 0-100
  total_correct INTEGER,
  total_questions INTEGER
);

CREATE TABLE quiz_attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  selected_option INTEGER, -- User's selected option index
  is_correct BOOLEAN,
  time_spent_seconds INTEGER
);

-- Indexes for performance
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_completed_at ON quiz_attempts(completed_at);
\`\`\`

### Recording Quiz Attempts

**File**: `app/actions/submit-quiz.ts`

\`\`\`typescript
export async function submitQuiz(params: {
  quizId: string;
  answers: Array<{
    questionId: string;
    selectedOption: number;
  }>;
}): Promise<{
  attemptId: string;
  score: number;
  totalCorrect: number;
  results: Array<{
    questionId: string;
    isCorrect: boolean;
    correctOption: number;
    explanation: string;
  }>;
}> {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // 1. Get quiz questions
  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("quiz_id", params.quizId)
    .order("order_index");
  
  // 2. Create attempt record
  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .insert({
      user_id: user.id,
      quiz_id: params.quizId,
      started_at: new Date(),
      total_questions: questions.length
    })
    .select()
    .single();
  
  // 3. Evaluate answers
  let totalCorrect = 0;
  const results = [];
  const answerRecords = [];
  
  for (const answer of params.answers) {
    const question = questions.find(q => q.id === answer.questionId);
    const isCorrect = answer.selectedOption === question.correct_option;
    
    if (isCorrect) totalCorrect++;
    
    results.push({
      questionId: question.id,
      isCorrect,
      correctOption: question.correct_option,
      explanation: question.explanation
    });
    
    answerRecords.push({
      attempt_id: attempt.id,
      question_id: question.id,
      selected_option: answer.selectedOption,
      is_correct: isCorrect
    });
  }
  
  // 4. Calculate score
  const score = (totalCorrect / questions.length) * 100;
  
  // 5. Update attempt with results
  await supabase
    .from("quiz_attempts")
    .update({
      completed_at: new Date(),
      score: score,
      total_correct: totalCorrect
    })
    .eq("id", attempt.id);
  
  // 6. Store individual answers
  await supabase
    .from("quiz_attempt_answers")
    .insert(answerRecords);
  
  return {
    attemptId: attempt.id,
    score,
    totalCorrect,
    results
  };
}
\`\`\`

---

## 2. Flashcard Review Tracking

### SM-2 Spaced Repetition Algorithm

\`\`\`sql
CREATE TABLE flashcard_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  card_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  quality INTEGER CHECK (quality BETWEEN 0 AND 5), -- SM-2 quality rating
  time_spent_seconds INTEGER
);

-- Update flashcard fields after each review
CREATE OR REPLACE FUNCTION update_flashcard_sm2()
RETURNS TRIGGER AS $$
DECLARE
  new_ease_factor NUMERIC;
  new_interval INTEGER;
  new_repetitions INTEGER;
BEGIN
  -- Get current card state
  SELECT ease_factor, interval, repetitions 
  INTO new_ease_factor, new_interval, new_repetitions
  FROM flashcards 
  WHERE id = NEW.card_id;
  
  -- SM-2 Algorithm
  IF NEW.quality >= 3 THEN
    -- Correct answer
    IF new_repetitions = 0 THEN
      new_interval := 1;
    ELSIF new_repetitions = 1 THEN
      new_interval := 6;
    ELSE
      new_interval := ROUND(new_interval * new_ease_factor);
    END IF;
    
    new_repetitions := new_repetitions + 1;
    new_ease_factor := new_ease_factor + (0.1 - (5 - NEW.quality) * (0.08 + (5 - NEW.quality) * 0.02));
    
    IF new_ease_factor < 1.3 THEN
      new_ease_factor := 1.3;
    END IF;
  ELSE
    -- Incorrect answer
    new_repetitions := 0;
    new_interval := 1;
  END IF;
  
  -- Update flashcard
  UPDATE flashcards
  SET
    ease_factor = new_ease_factor,
    interval = new_interval,
    repetitions = new_repetitions,
    next_review = NOW() + (new_interval || ' days')::INTERVAL
  WHERE id = NEW.card_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_flashcard_sm2
  AFTER INSERT ON flashcard_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_flashcard_sm2();
\`\`\`

### Recording Flashcard Reviews

**File**: `app/actions/review-flashcard.ts`

\`\`\`typescript
export async function reviewFlashcard(params: {
  cardId: string;
  quality: 0 | 1 | 2 | 3 | 4 | 5;
  timeSpentSeconds: number;
}): Promise<{
  nextReview: Date;
  interval: number;
}> {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Record review
  await supabase
    .from("flashcard_reviews")
    .insert({
      user_id: user.id,
      card_id: params.cardId,
      quality: params.quality,
      time_spent_seconds: params.timeSpentSeconds,
      reviewed_at: new Date()
    });
  
  // Get updated card (trigger will have updated it)
  const { data: card } = await supabase
    .from("flashcards")
    .select("next_review, interval")
    .eq("id", params.cardId)
    .single();
  
  return {
    nextReview: new Date(card.next_review),
    interval: card.interval
  };
}
\`\`\`

---

## 3. Learning Insights Engine

### Generating Insights

**File**: `app/actions/insights.ts`

\`\`\`typescript
export async function generateInsights(): Promise<{
  weeklyStreak: number;
  strongTopics: string[];
  weakTopics: string[];
  studyRecommendations: string[];
  progressTrend: "improving" | "stable" | "declining";
}> {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // 1. Calculate weekly streak
  const { data: recentAttempts } = await supabase
    .from("quiz_attempts")
    .select("completed_at")
    .eq("user_id", user.id)
    .gte("completed_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    .order("completed_at", { ascending: false });
  
  const weeklyStreak = calculateStreak(recentAttempts);
  
  // 2. Identify strong/weak topics
  const { data: topicPerformance } = await supabase
    .rpc("get_topic_performance", { p_user_id: user.id });
  
  const strongTopics = topicPerformance
    .filter(t => t.avg_score > 80)
    .map(t => t.topic_name);
  
  const weakTopics = topicPerformance
    .filter(t => t.avg_score < 60)
    .map(t => t.topic_name);
  
  // 3. Determine progress trend
  const progressTrend = calculateProgressTrend(recentAttempts);
  
  // 4. Generate recommendations
  const recommendations = generateRecommendations({
    weeklyStreak,
    weakTopics,
    progressTrend
  });
  
  return {
    weeklyStreak,
    strongTopics,
    weakTopics,
    studyRecommendations: recommendations,
    progressTrend
  };
}

function calculateStreak(attempts: any[]): number {
  // Check consecutive days with activity
  let streak = 0;
  let currentDate = new Date();
  
  for (let i = 0; i < 30; i++) {
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    const hasActivity = attempts.some(a => {
      const date = new Date(a.completed_at);
      return date >= dayStart && date <= dayEnd;
    });
    
    if (hasActivity) {
      streak++;
    } else {
      break;
    }
    
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  return streak;
}
\`\`\`

### SQL Functions for Analytics

\`\`\`sql
-- Get topic performance
CREATE OR REPLACE FUNCTION get_topic_performance(p_user_id UUID)
RETURNS TABLE (
  topic_name TEXT,
  avg_score NUMERIC,
  total_attempts INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.title AS topic_name,
    AVG(qa.score) AS avg_score,
    COUNT(qa.id) AS total_attempts
  FROM quiz_attempts qa
  JOIN quizzes q ON q.id = qa.quiz_id
  JOIN documents d ON d.id = q.doc_id
  WHERE qa.user_id = p_user_id
    AND qa.completed_at IS NOT NULL
  GROUP BY d.title
  ORDER BY avg_score DESC;
END;
$$ LANGUAGE plpgsql;
\`\`\`

---

## 4. Dashboard Metrics

### Key Metrics Computed

**File**: `app/actions/analytics.ts`

\`\`\`typescript
export async function getDashboardMetrics(): Promise<{
  totalQuizzesTaken: number;
  averageScore: number;
  totalFlashcardsReviewed: number;
  hoursStudied: number;
  recentActivity: Array<{
    type: "quiz" | "flashcard";
    title: string;
    score?: number;
    timestamp: Date;
  }>;
  performanceByWeek: Array<{
    week: string;
    averageScore: number;
    quizzesTaken: number;
  }>;
}> {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // 1. Total quizzes taken
  const { count: totalQuizzesTaken } = await supabase
    .from("quiz_attempts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .not("completed_at", "is", null);
  
  // 2. Average score
  const { data: scores } = await supabase
    .from("quiz_attempts")
    .select("score")
    .eq("user_id", user.id)
    .not("score", "is", null);
  
  const averageScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
  
  // 3. Total flashcards reviewed
  const { count: totalFlashcardsReviewed } = await supabase
    .from("flashcard_reviews")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);
  
  // 4. Hours studied (sum of time_spent)
  const { data: timeData } = await supabase
    .from("quiz_attempt_answers")
    .select("time_spent_seconds")
    .in("attempt_id", 
      supabase
        .from("quiz_attempts")
        .select("id")
        .eq("user_id", user.id)
    );
  
  const totalSeconds = timeData.reduce((sum, t) => sum + (t.time_spent_seconds || 0), 0);
  const hoursStudied = totalSeconds / 3600;
  
  // 5. Recent activity
  const recentActivity = await getRecentActivity(user.id);
  
  // 6. Performance by week
  const performanceByWeek = await getWeeklyPerformance(user.id);
  
  return {
    totalQuizzesTaken,
    averageScore,
    totalFlashcardsReviewed,
    hoursStudied,
    recentActivity,
    performanceByWeek
  };
}
\`\`\`

---

## Database Relationships Diagram

\`\`\`mermaid
erDiagram
    users ||--o{ documents : owns
    users ||--o{ quizzes : creates
    users ||--o{ quiz_attempts : takes
    users ||--o{ flashcard_reviews : performs
    
    documents ||--o{ document_chunks : contains
    documents ||--o{ quizzes : generates
    documents ||--o{ flashcard_decks : generates
    
    quizzes ||--o{ quiz_questions : contains
    quizzes ||--o{ quiz_attempts : attempted
    
    quiz_attempts ||--o{ quiz_attempt_answers : contains
    quiz_questions ||--o{ quiz_attempt_answers : answered
    
    flashcard_decks ||--o{ flashcards : contains
    flashcards ||--o{ flashcard_reviews : reviewed
    
    users {
        uuid id PK
        text email
        timestamptz created_at
    }
    
    documents {
        uuid id PK
        uuid user_id FK
        text title
        text source_type
        text raw_text
    }
    
    document_chunks {
        uuid id PK
        uuid document_id FK
        text chunk_text
        vector embedding
        int chunk_index
    }
    
    quizzes {
        uuid id PK
        uuid user_id FK
        uuid doc_id FK
        text title
        int num_questions
    }
    
    quiz_questions {
        uuid id PK
        uuid quiz_id FK
        text question_text
        jsonb options
        int correct_option
        text explanation
    }
    
    quiz_attempts {
        uuid id PK
        uuid user_id FK
        uuid quiz_id FK
        timestamptz started_at
        timestamptz completed_at
        numeric score
        int total_correct
    }
    
    quiz_attempt_answers {
        uuid id PK
        uuid attempt_id FK
        uuid question_id FK
        int selected_option
        boolean is_correct
        int time_spent_seconds
    }
    
    flashcard_decks {
        uuid id PK
        uuid user_id FK
        uuid doc_id FK
        text title
        int total_cards
    }
    
    flashcards {
        uuid id PK
        uuid deck_id FK
        text front
        text back
        numeric ease_factor
        int interval
        int repetitions
        timestamptz next_review
    }
    
    flashcard_reviews {
        uuid id PK
        uuid user_id FK
        uuid card_id FK
        timestamptz reviewed_at
        int quality
        int time_spent_seconds
    }
\`\`\`

---

## Visualization Components

### Chart.js Integration

**File**: `components/dashboard/performance-chart.tsx`

\`\`\`typescript
import { Line } from "react-chartjs-2";

export function PerformanceChart({ data }) {
  const chartData = {
    labels: data.map(d => d.week),
    datasets: [
      {
        label: "Average Score",
        data: data.map(d => d.averageScore),
        borderColor: "rgb(79, 70, 229)",
        backgroundColor: "rgba(79, 70, 229, 0.1)",
        tension: 0.4
      },
      {
        label: "Quizzes Taken",
        data: data.map(d => d.quizzesTaken),
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        yAxisID: "y1"
      }
    ]
  };
  
  const options = {
    responsive: true,
    interaction: {
      mode: "index",
      intersect: false
    },
    scales: {
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: { display: true, text: "Score (%)" }
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        title: { display: true, text: "Quizzes Taken" },
        grid: { drawOnChartArea: false }
      }
    }
  };
  
  return <Line data={chartData} options={options} />;
}
\`\`\`

---

## Advanced Analytics Queries

### Performance Trends

\`\`\`sql
-- Get performance trend over last 30 days
SELECT
  DATE_TRUNC('week', completed_at) AS week,
  AVG(score) AS avg_score,
  COUNT(*) AS quiz_count
FROM quiz_attempts
WHERE user_id = $1
  AND completed_at >= NOW() - INTERVAL '30 days'
  AND completed_at IS NOT NULL
GROUP BY week
ORDER BY week ASC;
\`\`\`

### Topic Mastery

\`\`\`sql
-- Calculate topic mastery levels
WITH topic_stats AS (
  SELECT
    d.id AS document_id,
    d.title AS topic,
    AVG(qa.score) AS avg_score,
    COUNT(qa.id) AS attempt_count
  FROM documents d
  LEFT JOIN quizzes q ON q.doc_id = d.id
  LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id
  WHERE d.user_id = $1
  GROUP BY d.id, d.title
)
SELECT
  topic,
  avg_score,
  attempt_count,
  CASE
    WHEN avg_score >= 90 THEN 'Master'
    WHEN avg_score >= 75 THEN 'Proficient'
    WHEN avg_score >= 60 THEN 'Competent'
    ELSE 'Needs Practice'
  END AS mastery_level
FROM topic_stats
ORDER BY avg_score DESC;
\`\`\`

---

## Real-Time Updates

### Supabase Realtime

\`\`\`typescript
// Subscribe to quiz attempts
const supabase = createClient();

useEffect(() => {
  const channel = supabase
    .channel("quiz_updates")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "quiz_attempts",
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log("New quiz attempt!", payload.new);
        // Update UI
        refetchDashboardMetrics();
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}, [userId]);
\`\`\`

---

## Privacy & Data Retention

### GDPR Compliance

\`\`\`sql
-- Delete user data (triggered on account deletion)
CREATE OR REPLACE FUNCTION delete_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Cascade deletes are handled by FK constraints
  -- Additional cleanup if needed
  DELETE FROM analytics_cache WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_user_data
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION delete_user_data();
\`\`\`

---

## Next Steps

- See [app/actions/analytics.ts](../app/actions/analytics.ts) for full implementation
- See [components/dashboard/](../components/dashboard/) for UI components
- See [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) for system context
