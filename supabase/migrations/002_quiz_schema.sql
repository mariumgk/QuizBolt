-- QuizBolt Layer 2 Migration: Quiz System
-- Run this in Supabase SQL Editor

-- =====================================================
-- QUIZ TABLES
-- =====================================================

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  num_questions INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz questions table (MCQ only)
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of 4 options: ["A", "B", "C", "D"]
  correct_option INTEGER NOT NULL CHECK (correct_option >= 0 AND correct_option <= 3), -- Index 0-3
  explanation TEXT,
  order_index INTEGER NOT NULL
);

-- Quiz attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  score NUMERIC, -- Percentage score 0-100
  total_correct INTEGER,
  total_questions INTEGER
);

-- Quiz attempt answers table
CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  selected_option INTEGER, -- User's selected option index (0-3)
  is_correct BOOLEAN
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_doc_id ON quizzes(doc_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempt_answers_attempt_id ON quiz_attempt_answers(attempt_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempt_answers ENABLE ROW LEVEL SECURITY;

-- Quizzes: Users can only access their own quizzes
CREATE POLICY "Users can view own quizzes"
  ON quizzes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quizzes"
  ON quizzes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quizzes"
  ON quizzes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quizzes"
  ON quizzes FOR DELETE
  USING (auth.uid() = user_id);

-- Quiz Questions: Access via quiz ownership
CREATE POLICY "Users can view questions of own quizzes"
  ON quiz_questions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM quizzes 
    WHERE quizzes.id = quiz_questions.quiz_id 
    AND quizzes.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert questions to own quizzes"
  ON quiz_questions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM quizzes 
    WHERE quizzes.id = quiz_questions.quiz_id 
    AND quizzes.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete questions from own quizzes"
  ON quiz_questions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM quizzes 
    WHERE quizzes.id = quiz_questions.quiz_id 
    AND quizzes.user_id = auth.uid()
  ));

-- Quiz Attempts: Users can only access their own attempts
CREATE POLICY "Users can view own attempts"
  ON quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts"
  ON quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attempts"
  ON quiz_attempts FOR UPDATE
  USING (auth.uid() = user_id);

-- Quiz Attempt Answers: Access via attempt ownership
CREATE POLICY "Users can view answers of own attempts"
  ON quiz_attempt_answers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM quiz_attempts 
    WHERE quiz_attempts.id = quiz_attempt_answers.attempt_id 
    AND quiz_attempts.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert answers to own attempts"
  ON quiz_attempt_answers FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM quiz_attempts 
    WHERE quiz_attempts.id = quiz_attempt_answers.attempt_id 
    AND quiz_attempts.user_id = auth.uid()
  ));
