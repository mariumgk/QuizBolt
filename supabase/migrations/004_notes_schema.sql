-- QuizBolt Layer 2 Migration: Notes System
-- Run this in Supabase SQL Editor

-- =====================================================
-- NOTES TABLE
-- =====================================================

-- Generated notes table
CREATE TABLE IF NOT EXISTS generated_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- Markdown formatted content
  style TEXT DEFAULT 'summary' CHECK (style IN ('outline', 'summary', 'detailed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_generated_notes_user_id ON generated_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_notes_doc_id ON generated_notes(doc_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE generated_notes ENABLE ROW LEVEL SECURITY;

-- Generated Notes: Users can only access their own notes
CREATE POLICY "Users can view own notes"
  ON generated_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON generated_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON generated_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON generated_notes FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGER FOR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_generated_notes_updated_at
  BEFORE UPDATE ON generated_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
