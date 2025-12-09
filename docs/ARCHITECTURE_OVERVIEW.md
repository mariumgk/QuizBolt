# QuizBolt Architecture Overview

## System Overview

QuizBolt is an AI-powered learning platform that transforms documents (PDFs, URLs, text) into interactive quizzes, flashcards, and AI-generated notes. The platform leverages Retrieval-Augmented Generation (RAG) to create contextually accurate learning content from user-uploaded materials.

### Core Technologies

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend Framework** | Next.js 14 (App Router) | Server-side rendering, routing, API routes |
| **Language** | TypeScript | Type safety across the application |
| **Styling** | Tailwind CSS + shadcn/ui | Modern, responsive UI components |
| **Authentication** | Supabase Auth | User authentication and session management |
| **Database** | Supabase (PostgreSQL) | Data persistence, user data, document storage |
| **Vector Database** | Supabase pgvector | Embedding storage for RAG retrieval |
| **Embeddings** | OpenAI text-embedding-3-small | Vector embeddings for semantic search |
| **LLM** | OpenAI GPT-4 Turbo/GPT-3.5 Turbo | Quiz generation, flashcards, notes, chat |
| **PDF Processing** | pdf-parse, pdf-lib | PDF text extraction and export |
| **State Management** | Zustand + React Query | Client state and server state caching |
| **Animations** | Framer Motion | Smooth UI transitions |

## Architecture Diagram

\`\`\`mermaid
graph TB
    subgraph "Client Layer"
        UI[Next.js UI<br/>React Components]
        STATE[Zustand Store<br/>React Query Cache]
    end
    
    subgraph "Application Layer"
        ROUTES[Next.js App Router<br/>Pages & Layouts]
        API[API Routes<br/>/app/api/]
        ACTIONS[Server Actions<br/>/app/actions/]
    end
    
    subgraph "RAG Pipeline - Layer 1"
        INGEST[Document Ingestion<br/>PDF/URL/Text]
        CLEAN[Text Cleaning<br/>Normalization]
        CHUNK[Text Chunking<br/>Semantic Splitting]
        EMBED[OpenAI Embeddings<br/>text-embedding-3-small]
        STORE[Vector Storage<br/>Supabase pgvector]
        RETRIEVE[Semantic Retrieval<br/>Similarity Search]
    end
    
    subgraph "AI Features - Layer 2"
        QUIZ[Quiz Generation<br/>GPT-4 Function Calling]
        FLASH[Flashcard Generation<br/>GPT-4]
        NOTES[AI Notes/Summaries<br/>GPT-4]
        CHAT[RAG Chat<br/>GPT-4 + Context]
        EVAL[Answer Evaluation<br/>GPT-4]
    end
    
    subgraph "Analytics - Layer 3"
        ATTEMPTS[Quiz Attempts Tracking]
        REVIEWS[Flashcard Reviews]
        INSIGHTS[Learning Insights Engine]
        METRICS[Dashboard Metrics]
    end
    
    subgraph "Data Layer"
        SUPABASE[(Supabase PostgreSQL)]
        PGVECTOR[(pgvector Extension)]
        AUTH[Supabase Auth]
    end
    
    UI --> ROUTES
    ROUTES --> API
    ROUTES --> ACTIONS
    STATE --> UI
    
    API --> INGEST
    ACTIONS --> QUIZ
    ACTIONS --> FLASH
    ACTIONS --> NOTES
    ACTIONS --> CHAT
    ACTIONS --> EVAL
    
    INGEST --> CLEAN
    CLEAN --> CHUNK
    CHUNK --> EMBED
    EMBED --> STORE
    STORE --> PGVECTOR
    
    CHAT --> RETRIEVE
    QUIZ --> RETRIEVE
    FLASH --> RETRIEVE
    NOTES --> RETRIEVE
    RETRIEVE --> PGVECTOR
    
    QUIZ --> SUPABASE
    FLASH --> SUPABASE
    NOTES --> SUPABASE
    ATTEMPTS --> SUPABASE
    REVIEWS --> SUPABASE
    INSIGHTS --> SUPABASE
    METRICS --> SUPABASE
    
    AUTH --> SUPABASE
    UI --> AUTH
\`\`\`

## Data Flow: From Upload to AI Generation

### 1. Document Ingestion → Embedding Flow

\`\`\`
User Upload (PDF/URL/Text)
    ↓
[Edge Function] Parse PDF / Fetch URL Content
    ↓
[lib/rag/clean.ts] Text Normalization
    ↓
[lib/rag/chunk.ts] Semantic Chunking (500-800 chars)
    ↓
[lib/rag/embed.ts] OpenAI Embeddings API
    ↓
[Supabase pgvector] Store embeddings with metadata
    ↓
Document Ready for AI Features
\`\`\`

### 2. AI Feature Generation Flow

\`\`\`
User Requests Quiz/Flashcards/Notes
    ↓
[lib/rag/retrieve.ts] Semantic Search (cosine similarity)
    ↓
[lib/rag/build-context.ts] Build prompt context (top-k chunks)
    ↓
[OpenAI GPT-4] Generate structured output (function calling)
    ↓
[Supabase] Store generated content
    ↓
[UI] Display interactive content
\`\`\`

### 3. User Interaction → Analytics Flow

\`\`\`
User Takes Quiz / Reviews Flashcards
    ↓
[app/actions/submit-quiz.ts] Record attempt answers
    ↓
[Supabase] Store attempt data + timestamps
    ↓
[app/actions/analytics.ts] Aggregate metrics
    ↓
[Dashboard UI] Display progress, insights, charts
\`\`\`

## OpenAI Models Used

### Embedding Model
- **Model**: `text-embedding-3-small`
- **Dimensions**: 1536
- **Use Case**: Converting text chunks to vector embeddings for semantic search
- **Cost**: ~$0.00002 per 1K tokens

### Language Models

#### Primary Model (Recommended)
- **Model**: `gpt-4-turbo-preview` or `gpt-4-1106-preview`
- **Use Cases**: 
  - Quiz generation (function calling)
  - Flashcard generation
  - Note summarization
  - Complex reasoning in chat
- **Cost**: Higher, but better quality

#### Fallback Model
- **Model**: `gpt-3.5-turbo`
- **Use Cases**: Same as above (configurable)
- **Cost**: Lower, faster responses

## RAG Pipeline Architecture

### Vector Storage Schema (Supabase pgvector)

\`\`\`sql
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  chunk_text TEXT,
  chunk_index INTEGER,
  embedding VECTOR(1536),  -- pgvector type
  metadata JSONB
);

-- Enable vector similarity search
CREATE INDEX ON document_chunks 
USING ivfflat (embedding vector_cosine_ops);
\`\`\`

### Retrieval Process

1. **User Query** → Convert to embedding using `text-embedding-3-small`
2. **Vector Search** → Find top-k similar chunks using cosine similarity
3. **Context Building** → Concatenate chunk texts for LLM prompt
4. **LLM Generation** → Generate quiz/flashcards/notes with context

## Security & Authentication

### Row-Level Security (RLS)

All Supabase tables enforce RLS policies:

\`\`\`sql
-- Example: Users can only access their own quizzes
CREATE POLICY "Users can view own quizzes"
  ON quizzes FOR SELECT
  USING (auth.uid() = user_id);
\`\`\`

### Authentication Flow

1. User signs up/logs in via Supabase Auth
2. Session stored in HTTP-only cookie
3. Middleware validates session on protected routes
4. Server actions verify user identity before DB operations

## Environment Variables

The application requires the following environment variables (see `.env.local`):

\`\`\`bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=         # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase anonymous key (public)
SUPABASE_SERVICE_ROLE_KEY=        # Supabase service role key (server-side)

# OpenAI Configuration
OPENAI_API_KEY=                   # OpenAI API key for embeddings & LLM

# Optional: Development Mode
DEV_FAKE_OPENAI=1                 # Use fake embeddings for local testing
\`\`\`

## Deployment Architecture

### Vercel Deployment (Recommended)

\`\`\`
GitHub Repository
    ↓
Vercel (Auto-deploy on push)
    ↓
Next.js App (Serverless Functions)
    ↓
Supabase (Managed PostgreSQL + Auth)
    ↓
OpenAI API (External Service)
\`\`\`

### Edge Functions

- **PDF Parsing**: Deployed as Supabase Edge Functions (Deno runtime)
- **Serverless**: Next.js API routes run as Vercel serverless functions

## Performance Considerations

### Caching Strategy

- **React Query**: Cache server data for 5 minutes (configurable)
- **Zustand**: Client-side state (UI preferences, temporary data)
- **Supabase**: Database query optimization with proper indexes

### Cost Optimization

- **Embeddings**: Batch chunk embeddings to reduce API calls
- **LLM**: Use `gpt-3.5-turbo` for simpler tasks, `gpt-4` for complex reasoning
- **Vector Search**: Limit top-k results to balance quality vs cost

## Scalability

### Current Limits
- **Document Size**: ~10MB PDFs (configurable)
- **Chunk Storage**: Unlimited (Supabase free tier: 500MB)
- **Concurrent Users**: Vercel serverless handles auto-scaling

### Future Enhancements
- [ ] Implement chunk caching for frequently accessed documents
- [ ] Add background job queue for long-running embeddings
- [ ] Implement rate limiting for OpenAI API calls
- [ ] Add Redis cache for hot data

## Development Workflow

\`\`\`bash
# Local Development
npm run dev               # Start Next.js dev server on :3000

# Database Migrations
supabase db push          # Apply migrations to local Supabase
supabase db reset         # Reset local database

# Deployment
git push origin main      # Auto-deploy to Vercel
\`\`\`

## Technology Stack Summary

\`\`\`
Frontend:
  ├── Next.js 14 (App Router)
  ├── React 18
  ├── TypeScript
  ├── Tailwind CSS
  ├── shadcn/ui components
  ├── Framer Motion
  └── Lucide Icons

Backend:
  ├── Next.js API Routes
  ├── Server Actions
  └── Supabase Edge Functions

Database:
  ├── Supabase (PostgreSQL)
  ├── pgvector extension
  └── Row-Level Security

AI/ML:
  ├── OpenAI text-embedding-3-small
  ├── OpenAI GPT-4 Turbo
  └── OpenAI GPT-3.5 Turbo

DevOps:
  ├── Vercel (hosting)
  ├── GitHub (version control)
  └── Supabase (managed database)
\`\`\`

## Next Steps

- See [LAYER1_RAG_PIPELINE.md](./LAYER1_RAG_PIPELINE.md) for RAG implementation details
- See [LAYER2_AI_FEATURES.md](./LAYER2_AI_FEATURES.md) for AI feature documentation
- See [LAYER3_ANALYTICS.md](./LAYER3_ANALYTICS.md) for analytics system
- See [SETUP_AND_INSTALLATION.md](./SETUP_AND_INSTALLATION.md) for installation guide
