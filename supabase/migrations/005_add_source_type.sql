-- Add source_type column to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'text';

-- Update existing records if any (optional, but good for consistency)
UPDATE documents 
SET source_type = 'upload' 
WHERE source_label LIKE '%.pdf';

UPDATE documents 
SET source_type = 'url' 
WHERE source_label LIKE 'http%';
