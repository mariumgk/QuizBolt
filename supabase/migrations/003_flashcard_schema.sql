-- QuizBolt Layer 2 Migration: Flashcard System
-- Run this in Supabase SQL Editor

-- =====================================================
-- FLASHCARD TABLES
-- =====================================================

-- Flashcard sets table
CREATE TABLE IF NOT EXISTS flashcard_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  num_cards INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL REFERENCES flashcard_sets(id) ON DELETE CASCADE,
  front TEXT NOT NULL, -- Question or term
  back TEXT NOT NULL,  -- Answer or definition
  order_index INTEGER NOT NULL,
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5) -- 0=new, 5=mastered
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_flashcard_sets_user_id ON flashcard_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_doc_id ON flashcard_sets(doc_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_set_id ON flashcards(set_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE flashcard_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- Flashcard Sets: Users can only access their own sets
CREATE POLICY "Users can view own flashcard sets"
  ON flashcard_sets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcard sets"
  ON flashcard_sets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcard sets"
  ON flashcard_sets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcard sets"
  ON flashcard_sets FOR DELETE
  USING (auth.uid() = user_id);

-- Flashcards: Access via set ownership
CREATE POLICY "Users can view flashcards of own sets"
  ON flashcards FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM flashcard_sets 
    WHERE flashcard_sets.id = flashcards.set_id 
    AND flashcard_sets.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert flashcards to own sets"
  ON flashcards FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM flashcard_sets 
    WHERE flashcard_sets.id = flashcards.set_id 
    AND flashcard_sets.user_id = auth.uid()
  ));

CREATE POLICY "Users can update flashcards of own sets"
  ON flashcards FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM flashcard_sets 
    WHERE flashcard_sets.id = flashcards.set_id 
    AND flashcard_sets.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete flashcards from own sets"
  ON flashcards FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM flashcard_sets 
    WHERE flashcard_sets.id = flashcards.set_id 
    AND flashcard_sets.user_id = auth.uid()
  ));
