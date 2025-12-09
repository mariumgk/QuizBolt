# Repository Structure Documentation

## Overview

This document provides a comprehensive guide to the QuizBolt codebase structure, explaining the purpose of each folder and how features connect across the application.

## Directory Tree

\`\`\`
quizbolt-frontend/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Authentication routes
│   ├── (dashboard)/              # Protected dashboard routes
│   ├── (public)/                 # Public routes
│   ├── actions/                  # Server Actions
│   ├── api/                      # API Routes
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── about/                    # About page components
│   ├── auth/                     # Authentication components
│   ├── chat/                     # Chat interface components
│   ├── dashboard/                # Dashboard components
│   ├── flashcards/               # Flashcard components
│   ├── quiz/                     # Quiz components
│   ├── ui/                       # shadcn/ui primitives
│   └── upload/                   # Upload components
├── lib/                          # Core libraries
│   ├── llm/                      # LLM utilities
│   ├── rag/                      # RAG pipeline
│   ├── supabase/                 # Supabase clients
│   ├── export-utils.ts           # Export utilities
│   ├── store.ts                  # Zustand store
│   └── utils.ts                  # Utility functions
├── supabase/                     # Supabase configuration
│   ├── functions/                # Edge Functions
│   ├── migrations/               # Database migrations
│   └── DEPLOYMENT.md             # Deployment guide
├── public/                       # Static assets
├── docs/                         # Documentation
├── .env.local                    # Environment variables (gitignored)
├── .gitignore                    # Git ignore rules
├── middleware.ts                 # Next.js middleware
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies
├── tailwind.config.ts            # Tailwind configuration
└── tsconfig.json                 # TypeScript configuration
\`\`\`

---

## `/app` - Next.js App Router

The `app` directory contains all routes, layouts, and page components using Next.js 14 App Router.

### `/app/(auth)` - Authentication Routes

**Purpose**: Handle user authentication (login, signup, password reset)

**Files**:
- `layout.tsx` - Auth pages layout (centered, minimal)
- `login/page.tsx` - Login page
- `signup/page.tsx` - Signup page
- `reset-password/page.tsx` - Password reset page

**Features**:
- Supabase Auth integration
- Email/password authentication
- Session management
- Redirects for authenticated users

**Connected to**:
- `components/auth/` - Auth form components
- `lib/supabase/client.ts` - Supabase client
- `middleware.ts` - Route protection

---

### `/app/(dashboard)` - Protected Dashboard Routes

**Purpose**: Main application interface for authenticated users

**Structure**:
\`\`\`
(dashboard)/
├── layout.tsx              # Dashboard layout with sidebar
├── dashboard/              # Home dashboard
│   └── page.tsx
├── upload/                 # Document upload
│   └── page.tsx
├── chat/                   # AI chat interface
│   └── page.tsx
├── quizzes/                # Quiz management
│   ├── page.tsx            # Quiz list
│   └── [id]/               # Individual quiz
│       └── page.tsx
├── flashcards/             # Flashcard management
│   ├── page.tsx            # Deck list
│   └── [id]/               # Individual deck
│       └── page.tsx
└── analytics/              # Learning analytics
    └── page.tsx
\`\`\`

**Features**:
- Document upload and management
- Quiz generation and taking
- Flashcard creation and review
- AI chat with documents
- Progress analytics

**Connected to**:
- `app/actions/` - Server Actions for data mutations
- `components/dashboard/` - Dashboard UI components
- `lib/rag/` - RAG pipeline for AI features

---

### `/app/(public)` - Public Routes

**Purpose**: Publicly accessible pages (landing, about, pricing)

**Files**:
- `layout.tsx` - Public layout with navbar
- `about/page.tsx` - About page
- `pricing/page.tsx` - Pricing information

**Features**:
- Marketing content
- Feature descriptions
- Public navigation

**Connected to**:
- `components/about/` - About page components
- `app/page.tsx` - Landing page

---

### `/app/actions` - Server Actions

**Purpose**: Server-side data mutations and API calls

**Key Files**:

| File | Purpose | Database Tables |
|------|---------|-----------------|
| `ingest.ts` | Document ingestion | `documents`, `document_chunks` |
| `generate-quiz.ts` | Quiz generation | `quizzes`, `quiz_questions` |
| `generate-flashcards.ts` | Flashcard generation | `flashcard_decks`, `flashcards` |
| `generate-notes.ts` | AI notes generation | `notes` |
| `rag-chat.ts` | RAG-powered chat | `documents`, `document_chunks` |
| `submit-quiz.ts` | Quiz submission | `quiz_attempts`, `quiz_attempt_answers` |
| `analytics.ts` | Analytics data | All tables |
| `retrieve-chunks.ts` | RAG retrieval | `document_chunks` |

**Pattern**:
\`\`\`typescript
"use server"; // Mark as Server Action

import { createServerSupabaseClient } from "@/supabase/server";

export async function actionName(params: Params): Promise<Result> {
  // 1. Auth check
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  // 2. Business logic
  // ...
  
  // 3. Database operations
  // ...
  
  return result;
}
\`\`\`

**Connected to**:
- `lib/rag/` - RAG pipeline utilities
- `lib/llm/` - LLM client
- Supabase database

---

### `/app/api` - API Routes

**Purpose**: RESTful API endpoints (primarily for exports and webhooks)

**Structure**:
\`\`\`
api/
├── upload-pdf/
│   └── route.ts           # PDF upload endpoint
├── parse-pdf/
│   └── route.ts           # PDF parsing
└── quizzes/
    └── [quizId]/
        └── export/
            ├── pdf/
            │   └── route.ts  # PDF export
            └── docx/
                └── route.ts  # DOCX export
\`\`\`

**Example**: PDF Export
\`\`\`typescript
// app/api/quizzes/[quizId]/export/pdf/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  // Generate PDF and return as download
  const pdfBytes = await generateQuizPDF({ ... });
  return new Response(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="quiz.pdf"`
    }
  });
}
\`\`\`

---

## `/components` - React Components

Organized by feature domain.

### `/components/ui` - Base UI Components

**Purpose**: Reusable shadcn/ui-style primitives

**Files**:
- `button.tsx` - Button component
- `card.tsx` - Card layouts
- `input.tsx` - Form inputs
- `dialog.tsx` - Modal dialogs
- `dropdown-menu.tsx` - Dropdown menus
- `tabs.tsx` - Tab navigation
- `badge.tsx` - Status badges
- `progress.tsx` - Progress bars

**Pattern**:
\`\`\`typescript
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline";
}

export function Button({ variant = "default", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
\`\`\`

---

### `/components/dashboard` - Dashboard Components

**Files**:
- `sidebar.tsx` - Navigation sidebar
- `stats-card.tsx` - Metric cards
- `recent-activity.tsx` - Activity feed
- `performance-chart.tsx` - Chart.js charts
- `ai-insights.tsx` - AI-generated insights

**Connected to**:
- `app/actions/analytics.ts` - Data fetching
- `lib/store.ts` - Client state

---

### `/components/quiz` - Quiz Components

**Files**:
- `quiz-list.tsx` - List of quizzes
- `quiz-card.tsx` - Quiz preview card
- `quiz-attempt.tsx` - Quiz taking interface
- `question-card.tsx` - Single question display
- `quiz-results.tsx` - Results summary

**Connected to**:
- `app/actions/generate-quiz.ts` - Quiz generation
- `app/actions/submit-quiz.ts` - Quiz submission

---

### `/components/flashcards` - Flashcard Components

**Files**:
- `flashcard-deck-list.tsx` - Deck list
- `flashcard-review.tsx` - Review interface
- `flashcard-flip.tsx` - Flip animation

**Connected to**:
- `app/actions/generate-flashcards.ts`
- `app/actions/review-flashcard.ts`

---

### `/components/chat` - Chat Components

**Files**:
- `chat-interface.tsx` - Main chat UI
- `message-list.tsx` - Message display
- `message-input.tsx` - Input field

**Connected to**:
- `app/actions/rag-chat.ts` - RAG-powered responses

---

## `/lib` - Core Libraries

### `/lib/rag` - RAG Pipeline

**Purpose**: Document processing and retrieval

**Files**:

| File | Purpose | Exports |
|------|---------|---------|
| `clean.ts` | Text normalization | `cleanText()` |
| `chunk.ts` | Text chunking | `chunkText()`, `TextChunk` |
| `embed.ts` | OpenAI embeddings | `embedChunks()`, `embedQuery()` |
| `document-chunks.ts` | Chunk storage | `storeDocumentChunks()`, `getDocumentChunks()` |
| `retrieve.ts` | Vector search | `retrieveChunks()` |
| `context.ts` | Context building | `buildContextFromChunks()` |

**Flow**:
\`\`\`
Raw Text
  ↓ clean.ts
Cleaned Text
  ↓ chunk.ts
Text Chunks
  ↓ embed.ts
Embeddings
  ↓ document-chunks.ts
Stored in Supabase
  ↓ retrieve.ts
Retrieved Chunks
  ↓ context.ts
LLM Context
\`\`\`

---

### `/lib/supabase` - Supabase Clients

**Files**:
- `client.ts` - Browser client (client-side)
- `server.ts` - Server client (Server Actions, API Routes)

**Usage**:
\`\`\`typescript
// Client-side
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();

// Server-side
import { createServerSupabaseClient } from "@/lib/supabase/server";
const supabase = createServerSupabaseClient();
\`\`\`

---

### `/lib/llm` - LLM Utilities

**Files**:
- `openai.ts` - OpenAI client wrapper
- `prompts.ts` - Prompt templates

---

### `/lib/store.ts` - Zustand Store

**Purpose**: Client-side global state

**State**:
\`\`\`typescript
interface AppState {
  currentDocId: string | null;
  setCurrentDocId: (id: string | null) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}
\`\`\`

---

### `/lib/utils.ts` - Utility Functions

**Exports**:
\`\`\`typescript
// Tailwind class merging
export function cn(...inputs: ClassValue[]): string;

// Date formatting
export function formatDate(date: Date): string;

// Number formatting
export function formatScore(score: number): string;
\`\`\`

---

## `/supabase` - Supabase Configuration

### `/supabase/migrations` - Database Schema

**Files** (Applied in order):
1. `002_quiz_schema.sql` - Quiz tables
2. `003_flashcard_schema.sql` - Flashcard tables
3. `004_notes_schema.sql` - Notes tables
4. `005_add_source_type.sql` - Document source types
5. `006_analytics_schema.sql` - Analytics tables

**Running Migrations**:
\`\`\`bash
supabase db push
\`\`\`

---

### `/supabase/functions` - Edge Functions

**Purpose**: Serverless functions running on Deno

**Files**:
- `parse-pdf/index.ts` - PDF text extraction

**Deployment**:
\`\`\`bash
supabase functions deploy parse-pdf
\`\`\`

---

## Configuration Files

### `middleware.ts`

**Purpose**: Route protection and authentication

\`\`\`typescript
export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient({ request });
  const { data: { session } } = await supabase.auth.getSession();
  
  // Redirect unauthenticated users from protected routes
  if (!session && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  return response;
}
\`\`\`

---

### `next.config.js`

**Purpose**: Next.js configuration

**Key Settings**:
- Webpack configuration for PDF libraries
- Image optimization
- Environment variable handling

---

### `tailwind.config.ts`

**Purpose**: Tailwind CSS customization

**Customizations**:
- Color palette
- Typography
- Component variants
- Animation utilities

---

## How Features Connect

### Example: Quiz Generation Flow

\`\`\`
1. User uploads PDF
   ├── UI: components/upload/upload-area.tsx
   └── Action: app/actions/ingest.ts
       ├── Edge Function: supabase/functions/parse-pdf
       └── RAG Pipeline: lib/rag/
           ├── clean.ts
           ├── chunk.ts
           ├── embed.ts
           └── document-chunks.ts (stores in Supabase)

2. User requests quiz
   ├── UI: app/(dashboard)/quizzes/page.tsx
   └── Action: app/actions/generate-quiz.ts
       ├── RAG: lib/rag/retrieve.ts (get relevant chunks)
       ├── LLM: Call OpenAI GPT-4
       └── Database: Store in quizzes & quiz_questions tables

3. User takes quiz
   ├── UI: components/quiz/quiz-attempt.tsx
   └── Action: app/actions/submit-quiz.ts
       └── Database: Store in quiz_attempts & quiz_attempt_answers

4. User views analytics
   ├── UI: app/(dashboard)/analytics/page.tsx
   ├── Components: components/dashboard/performance-chart.tsx
   └── Action: app/actions/analytics.ts
       └── Database: Query across all analytics tables
\`\`\`

---

## File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `QuizCard.tsx` |
| Pages | kebab-case | `[id]/page.tsx` |
| Actions | kebab-case | `generate-quiz.ts` |
| Utilities | camelCase | `formatDate()` |
| Types | PascalCase | `QuizQuestion` |
| Hooks | camelCase with `use` prefix | `useQuizData()` |

---

## Quick Navigation Guide

**Want to**... **Go to**...

- Add a new page → `app/(dashboard)/your-page/page.tsx`
- Create a server action → `app/actions/your-action.ts`
- Add a UI component → `components/your-feature/YourComponent.tsx`
- Modify RAG pipeline → `lib/rag/`
- Update database schema → `supabase/migrations/XXX_your_migration.sql`
- Add API endpoint → `app/api/your-endpoint/route.ts`
- Configure environment → `.env.local`

---

## Next Steps

- See [SETUP_AND_INSTALLATION.md](./SETUP_AND_INSTALLATION.md) for getting started
- See [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) for system design
- See individual layer docs for feature implementation details
