-- QuizBolt Layer 4 Migration: Advanced Analytics
-- Run this in Supabase SQL Editor

-- =====================================================
-- TABLE UPDATES
-- =====================================================

-- Add columns to quiz_attempts
ALTER TABLE quiz_attempts 
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add columns to quiz_attempt_answers
ALTER TABLE quiz_attempt_answers
ADD COLUMN IF NOT EXISTS user_answer TEXT,
ADD COLUMN IF NOT EXISTS correct_answer TEXT,
ADD COLUMN IF NOT EXISTS explanation TEXT;

-- =====================================================
-- NEW TABLES
-- =====================================================

-- Flashcard Reviews Table
CREATE TABLE IF NOT EXISTS flashcard_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flashcard_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5), -- 1=Hard, 5=Easy
  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document Metadata Table
CREATE TABLE IF NOT EXISTS document_metadata (
  doc_id UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_count INTEGER DEFAULT 0,
  chunk_count INTEGER DEFAULT 0,
  token_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_user_id ON flashcard_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_flashcard_id ON flashcard_reviews(flashcard_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_reviewed_at ON flashcard_reviews(reviewed_at);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE flashcard_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_metadata ENABLE ROW LEVEL SECURITY;

-- Flashcard Reviews Policies
CREATE POLICY "Users can view own flashcard reviews"
  ON flashcard_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcard reviews"
  ON flashcard_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Document Metadata Policies
CREATE POLICY "Users can view own document metadata"
  ON document_metadata FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own document metadata"
  ON document_metadata FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own document metadata"
  ON document_metadata FOR UPDATE
  USING (auth.uid() = user_id);
