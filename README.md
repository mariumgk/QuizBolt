# QuizBolt Frontend

QuizBolt is an AI-assisted learning platform. This repository contains the **frontend-only**, production-style implementation built with **Next.js 14 App Router**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Zustand**, **React Query**, **Framer Motion**, **Lucide Icons**, **Vercel AI SDK (client mock)**, and **Recharts**.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui-style UI components
- Zustand for local app state
- React Query (TanStack Query) for server/mocked API state
- Framer Motion for transitions and micro-animations
- Lucide Icons
- React Hook Form + Zod for forms & validation
- Vercel AI SDK (client-only mock) for chat streaming UI
- Recharts for analytics & progress graphs

## Getting Started

### 1. Install dependencies

```bash
npm install
# or
pnpm install
# or
yarn
```

### 2. Run the development server

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Then open http://localhost:3000 in your browser.

## Project Structure

- `app/`
  - App Router routes, layouts, and pages
- `components/`
  - Reusable UI components: layout, quiz, flashcards, dashboard, chat, upload
- `components/ui/`
  - shadcn-style primitives (Button, Input, Card, etc.)
- `lib/mock-api/`
  - Promise-based mock API layer for quizzes, flashcards, chat, analytics
- `lib/store.ts`
  - Zustand global store
- `lib/utils.ts`
  - Utility helpers, e.g. className merge
- `public/`
  - Placeholder images/documents

## Mock API Layer

The app uses a **mock backend** implemented under `lib/mock-api/`. Each function returns a `Promise` and uses `setTimeout` to simulate network latency.

Examples include:

- `mockGenerateQuiz()`
- `mockGetQuizzes()`
- `mockGenerateFlashcards()`
- `mockChatStream()` (client-side streaming mock)
- `mockGetAnalytics()`

These are consumed via **React Query** hooks inside the UI.

## Future Backend Integration

- Replace implementations in `lib/mock-api/*` with real HTTP/Supabase/GraphQL calls.
- Keep function signatures to minimize refactors in components.
- Introduce auth tokens and real session handling.
- Move persistence from in-memory/Zustand to a real database.

## Notes

- This codebase is intentionally structured as if it were production-ready, but with all backend calls mocked.
- You can iterate on UI/UX, connect real APIs later, and gradually harden types and validation.
