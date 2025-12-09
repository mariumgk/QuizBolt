# Layer 1: RAG Pipeline Documentation

## Overview

The RAG (Retrieval-Augmented Generation) pipeline is the foundation of QuizBolt's AI capabilities. It transforms raw documents into searchable vector embeddings, enabling semantic retrieval for context-aware AI generation.

## Layer 1 Responsibilities

1. **Document Ingestion** - Accept PDFs, URLs, and plain text
2. **Text Extraction** - Extract clean text from various formats
3. **Text Preprocessing** - Clean and normalize extracted text
4. **Semantic Chunking** - Split text into meaningful segments
5. **Embedding Generation** - Convert chunks to vector embeddings
6. **Vector Storage** - Store embeddings in Supabase pgvector
7. **Semantic Retrieval** - Find relevant chunks for user queries

## Pipeline Architecture

\`\`\`mermaid
sequenceDiagram
    participant User
    participant UI
    participant IngestAction as app/actions/ingest.ts
    participant PDFEdge as Supabase Edge: parse-pdf
    participant Clean as lib/rag/clean.ts
    participant Chunk as lib/rag/chunk.ts
    participant Embed as lib/rag/embed.ts
    participant Store as lib/rag/document-chunks.ts
    participant Supabase as PostgreSQL + pgvector
    
    User->>UI: Upload PDF/URL/Text
    UI->>IngestAction: Trigger ingestion
    
    alt PDF Upload
        IngestAction->>PDFEdge: Send PDF blob
        PDFEdge-->>IngestAction: Return extracted text
    else URL Upload
        IngestAction->>IngestAction: Fetch URL content
    else Text Upload
        IngestAction->>IngestAction: Use text directly
    end
    
    IngestAction->>Clean: Normalize text
    Clean-->>IngestAction: Cleaned text
    
    IngestAction->>Chunk: Split into chunks
    Chunk-->>IngestAction: Array of TextChunks
    
    IngestAction->>Embed: Generate embeddings
    Embed-->>IngestAction: Array of vectors
    
    IngestAction->>Store: Store chunks + embeddings
    Store->>Supabase: INSERT into document_chunks
    Supabase-->>Store: Success
    
    Store-->>IngestAction: Document ready
    IngestAction-->>UI: Ingestion complete
    UI-->>User: Document ready for AI features
\`\`\`

## Code Flow Walkthrough

### 1. Document Ingestion (`app/actions/ingest.ts`)

**Purpose**: Entry point for document ingestion. Handles different source types.

**Key Functions**:

\`\`\`typescript
export async function ingestDocument(params: {
  title: string;
  sourceType: "pdf" | "url" | "text";
  content?: string;        // For text uploads
  url?: string;           // For URL uploads
  pdfFile?: File;         // For PDF uploads
}): Promise<{ documentId: string }>;
\`\`\`

**Flow**:
1. Validate user authentication
2. Create document record in Supabase
3. Extract text based on source type:
   - **PDF**: Call Supabase Edge Function
   - **URL**: Fetch and extract with JSDOM
   - **Text**: Use directly
4. Pass text to RAG pipeline
5. Return document ID

**File**: [app/actions/ingest.ts](../app/actions/ingest.ts)

---

### 2. PDF Extraction (`supabase/functions/parse-pdf`)

**Purpose**: Server-side PDF text extraction using Deno runtime.

**Why Edge Function?**
- PDFs can be large (avoiding client-side processing)
- Secure handling of uploaded files
- Offload heavy computation from Next.js server

**Technology**: `pdf-parse` library in Deno environment

**API Endpoint**:
\`\`\`
POST /functions/v1/parse-pdf
Content-Type: application/json

{
  "pdfBase64": "base64-encoded-pdf-content"
}

Response:
{
  "text": "Extracted text from PDF...",
  "numPages": 42
}
\`\`\`

---

### 3. Text Cleaning (`lib/rag/clean.ts`)

**Purpose**: Normalize and clean extracted text for better embedding quality.

**Functions**:

\`\`\`typescript
export function cleanText(text: string): string;
\`\`\`

**Cleaning Steps**:
1. **Normalize Unicode** - Convert special characters
2. **Remove Extra Whitespace** - Collapse multiple spaces/newlines
3. **Remove Special Symbols** - Clean up PDF artifacts
4. **Trim** - Remove leading/trailing whitespace

**Example**:
\`\`\`typescript
// Before
const raw = "Hello\\n\\n\\n   World\\u2019s   best\\t\\tapp!";

// After
const clean = cleanText(raw);
// "Hello World's best app!"
\`\`\`

**File**: [lib/rag/clean.ts](../lib/rag/clean.ts)

---

### 4. Text Chunking (`lib/rag/chunk.ts`)

**Purpose**: Split long documents into semantically meaningful chunks for embedding.

**Why Chunking?**
- Embedding models have token limits (8191 tokens for `text-embedding-3-small`)
- Smaller chunks = more precise retrieval
- Each chunk becomes a searchable unit

**Strategy**: **Semantic Chunking**

\`\`\`typescript
export interface TextChunk {
  text: string;
  index: number;
  metadata?: Record<string, any>;
}

export function chunkText(
  text: string,
  options?: {
    maxChunkSize?: number;    // Default: 800 characters
    overlap?: number;          // Default: 100 characters
  }
): TextChunk[];
\`\`\`

**Algorithm**:
1. Split by paragraphs (double newline)
2. If paragraph > `maxChunkSize`, split by sentences
3. Combine small chunks until reaching target size
4. Add overlap between chunks for context continuity

**Example**:
\`\`\`typescript
const text = "Very long document...";
const chunks = chunkText(text, { maxChunkSize: 500, overlap: 50 });

// Result:
// [
//   { text: "First 500 chars...", index: 0 },
//   { text: "...last 50 chars from prev + next 450...", index: 1 },
//   ...
// ]
\`\`\`

**File**: [lib/rag/chunk.ts](../lib/rag/chunk.ts)

---

### 5. Embedding Generation (`lib/rag/embed.ts`)

**Purpose**: Convert text chunks to vector embeddings using OpenAI.

**Model**: `text-embedding-3-small` (1536 dimensions)

**Functions**:

\`\`\`typescript
export type Embedding = number[]; // 1536-dimensional vector

export async function embedChunks(chunks: TextChunk[]): Promise<Embedding[]>;
export async function embedQuery(query: string): Promise<Embedding>;
\`\`\`

**Implementation**:

\`\`\`typescript
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function embedText(text: string): Promise<Embedding> {
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  
  return response.data[0]?.embedding ?? [];
}

export async function embedChunks(chunks: TextChunk[]): Promise<Embedding[]> {
  const texts = chunks.map(c => c.text);
  
  // Batch API call (more efficient)
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,  // Array of strings
  });
  
  return response.data.map(item => item.embedding);
}
\`\`\`

**Development Mode** (Fake Embeddings):
\`\`\`typescript
// Set DEV_FAKE_OPENAI=1 to avoid API costs during development
function fakeEmbeddingFromText(text: string): Embedding {
  // Deterministic hash-based embedding for testing
  const out = new Array(128).fill(0);
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  for (let i = 0; i < 128; i++) {
    out[i] = (((hash >>> (i % 24)) & 0xff) / 255) * 2 - 1;
  }
  return out;
}
\`\`\`

**Cost Optimization**:
- Batch embedding calls reduce API overhead
- Cache embeddings to avoid re-computing
- Use fake embeddings for development

**File**: [lib/rag/embed.ts](../lib/rag/embed.ts)

---

### 6. Vector Storage (`lib/rag/document-chunks.ts`)

**Purpose**: Store text chunks and embeddings in Supabase with pgvector.

**Database Schema**:

\`\`\`sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  source_type TEXT CHECK (source_type IN ('pdf', 'url', 'text')),
  source_url TEXT,
  raw_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding VECTOR(1536), -- pgvector type
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector similarity search index
CREATE INDEX document_chunks_embedding_idx 
ON document_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
\`\`\`

**Functions**:

\`\`\`typescript
export async function storeDocumentChunks(
  documentId: string,
  chunks: TextChunk[],
  embeddings: Embedding[]
): Promise<void>;

export async function getDocumentChunks(
  documentId: string
): Promise<Array<{
  id: string;
  chunkText: string;
  chunkIndex: number;
  embedding: number[];
}>>;
\`\`\`

**Implementation**:

\`\`\`typescript
import { createServerSupabaseClient } from "@/supabase/server";

export async function storeDocumentChunks(
  documentId: string,
  chunks: TextChunk[],
  embeddings: Embedding[]
) {
  const supabase = createServerSupabaseClient();
  
  const records = chunks.map((chunk, i) => ({
    document_id: documentId,
    chunk_text: chunk.text,
    chunk_index: chunk.index,
    embedding: embeddings[i], // pgvector automatically handles number[]
    metadata: chunk.metadata || {},
  }));
  
  const { error } = await supabase
    .from("document_chunks")
    .insert(records);
    
  if (error) throw new Error(`Failed to store chunks: ${error.message}`);
}
\`\`\`

**File**: [lib/rag/document-chunks.ts](../lib/rag/document-chunks.ts)

---

### 7. Semantic Retrieval (`lib/rag/retrieve.ts`)

**Purpose**: Find the most relevant text chunks for a given query using vector similarity.

**Similarity Metric**: **Cosine Similarity**

\`\`\`
similarity = (A · B) / (||A|| * ||B||)
\`\`\`

**Functions**:

\`\`\`typescript
export async function retrieveChunks(params: {
  documentId: string;
  query: string;
  topK?: number;          // Default: 5
  similarityThreshold?: number; // Default: 0.7
}): Promise<Array<{
  chunkId: string;
  chunkText: string;
  similarity: number;
}>>;
\`\`\`

**Implementation**:

\`\`\`typescript
import { embedQuery } from "./embed";
import { createServerSupabaseClient } from "@/supabase/server";

export async function retrieveChunks({
  documentId,
  query,
  topK = 5,
  similarityThreshold = 0.7,
}) {
  // 1. Embed the user's query
  const queryEmbedding = await embedQuery(query);
  
  const supabase = createServerSupabaseClient();
  
  // 2. Find similar chunks using pgvector
  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: queryEmbedding,
    match_document_id: documentId,
    match_threshold: similarityThreshold,
    match_count: topK,
  });
  
  if (error) throw error;
  
  return data.map((row: any) => ({
    chunkId: row.id,
    chunkText: row.chunk_text,
    similarity: row.similarity,
  }));
}
\`\`\`

**Supabase RPC Function** (SQL):

\`\`\`sql
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding VECTOR(1536),
  match_document_id UUID,
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  chunk_text TEXT,
  chunk_index INT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_chunks.id,
    document_chunks.chunk_text,
    document_chunks.chunk_index,
    1 - (document_chunks.embedding <=> query_embedding) AS similarity
  FROM document_chunks
  WHERE document_chunks.document_id = match_document_id
    AND 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY document_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
\`\`\`

**File**: [lib/rag/retrieve.ts](../lib/rag/retrieve.ts)

---

## Complete Pipeline Example

### End-to-End Flow

\`\`\`typescript
// User uploads a PDF about "Machine Learning"

// 1. Ingest
const result = await ingestDocument({
  title: "ML Textbook Chapter 3",
  sourceType: "pdf",
  pdfFile: uploadedFile,
});

// Behind the scenes:
// - PDF → parse-pdf edge function → "Machine learning is a subset..."
// - Clean → "machine learning is a subset..."
// - Chunk → [
//     "machine learning is a subset of AI that focuses...",
//     "supervised learning requires labeled data for training...",
//     ...
//   ]
// - Embed → [
//     [0.123, -0.456, 0.789, ...],  // 1536 dimensions
//     [0.234, -0.567, 0.890, ...],
//     ...
//   ]
// - Store → Supabase pgvector

// 2. Later: User asks for quiz on "supervised learning"

// Retrieve relevant chunks
const chunks = await retrieveChunks({
  documentId: result.documentId,
  query: "supervised learning algorithms",
  topK: 5,
});

// Returns:
// [
//   {
//     chunkText: "supervised learning requires labeled data...",
//     similarity: 0.92
//   },
//   {
//     chunkText: "common supervised algorithms include...",
//     similarity: 0.88
//   },
//   ...
// ]

// 3. Build context for LLM
const context = chunks.map(c => c.chunkText).join("\\n\\n");

// 4. Generate quiz with context
const quiz = await generateQuiz({
  docId: result.documentId,
  numQuestions: 10,
  difficulty: "medium",
});
\`\`\`

## Error Handling

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `OPENAI_API_KEY not set` | Missing environment variable | Add to `.env.local` |
| `Embedding dimension mismatch` | Wrong model or corrupted data | Verify using `text-embedding-3-small` |
| `pgvector index missing` | Database migration not applied | Run `supabase db push` |
| `PDF parsing timeout` | Large PDF file | Implement chunked processing |

### Retry Strategy

\`\`\`typescript
async function embedWithRetry(text: string, retries = 3): Promise<Embedding> {
  for (let i = 0; i < retries; i++) {
    try {
      return await embedText(text);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error("Max retries reached");
}
\`\`\`

## Testing the RAG Pipeline

### Local Testing (Fake Embeddings)

\`\`\`bash
# .env.local
DEV_FAKE_OPENAI=1
\`\`\`

### Integration Test

See [TESTING_LAYER1.md](../TESTING_LAYER1.md) for comprehensive test examples.

\`\`\`typescript
// Test full pipeline
const testDoc = await ingestDocument({
  title: "Test Document",
  sourceType: "text",
  content: "This is a test about machine learning and AI.",
});

const chunks = await retrieveChunks({
  documentId: testDoc.documentId,
  query: "machine learning",
  topK: 3,
});

console.assert(chunks.length > 0, "Should retrieve relevant chunks");
console.assert(chunks[0].similarity > 0.5, "Top chunk should be relevant");
\`\`\`

## Performance Metrics

### Typical Processing Times

| Step | Duration | Notes |
|------|----------|-------|
| PDF Parsing (10 pages) | ~2-3s | Edge function latency |
| Text Cleaning | ~10ms | Fast regex operations |
| Chunking (50 chunks) | ~50ms | In-memory processing |
| Embedding (50 chunks) | ~1-2s | OpenAI API latency |
| Vector Storage | ~500ms | Supabase insert batch |
| **Total Pipeline** | **~4-6s** | For 10-page PDF |

### Cost Estimation

| Component | Cost per Document (10 pages) |
|-----------|------------------------------|
| PDF Parsing (Edge Function) | FREE (Supabase) |
| Embeddings (50 chunks) | ~$0.001 |
| Storage (pgvector) | FREE (up to 500MB) |
| **Total** | **~$0.001** |

## Next Steps

- See [LAYER2_AI_FEATURES.md](./LAYER2_AI_FEATURES.md) for how RAG powers AI features
- See [lib/rag/context.ts](../lib/rag/context.ts) for context building utilities
- See [app/actions/retrieve-chunks.ts](../app/actions/retrieve-chunks.ts) for retrieval server actions
