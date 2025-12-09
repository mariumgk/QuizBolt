# Setup and Installation Guide

## System Requirements

Before you begin, ensure you have the following installed:

### Required Software

- **Node.js**: v18.17.0 or higher
  - Check version: `node --version`
  - Download: https://nodejs.org/

- **npm**: v9.0.0 or higher (comes with Node.js)
  - Check version: `npm --version`

- **Git**: Latest version
  - Check version: `git --version`
  - Download: https://git-scm.com/

### Optional (Recommended)

- **Supabase CLI**: For local database development
  - Install: `npm install -g supabase`
  - Docs: https://supabase.com/docs/guides/cli

- **VS Code**: Recommended IDE with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features

---

## Installation Steps

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/your-username/quizbolt.git
cd quizbolt/quizbolt-frontend
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

This will install all required packages including:
- Next.js 14
- React 18
- Supabase client libraries
- OpenAI SDK
- pdf-lib, docx
- Tailwind CSS
- shadcn/ui components
- Chart.js
- And more (see `package.json`)

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Or create it manually and add the following:

\`\`\`bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Optional: Development Mode (Use fake embeddings to save costs)
DEV_FAKE_OPENAI=0
\`\`\`

**Where to get these values?** See [Environment Variables](#environment-variables) section below.

### 4. Set Up Supabase Database

You have two options: **Cloud** (recommended for beginners) or **Local** (for advanced developers).

#### Option A: Cloud Supabase (Recommended)

1. Go to https://app.supabase.com
2. Create a new project
3. Wait for the project to be provisioned (~2 minutes)
4. Copy your project URL and API keys:
   - Go to Settings → API
   - Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

5. Run database migrations:
   - Go to SQL Editor in Supabase dashboard
   - Copy each migration file from `supabase/migrations/` (in order)
   - Execute them one by one

#### Option B: Local Supabase

\`\`\`bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# Apply migrations
supabase db push

# Get local credentials (printed after 'supabase start')
# - API URL: http://localhost:54321
# - Anon key: <printed-in-terminal>
# - Service role key: <printed-in-terminal>
\`\`\`

Update `.env.local` with local values:
\`\`\`bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<local-service-role-key>
\`\`\`

### 5. Set Up OpenAI API

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key → `OPENAI_API_KEY` in `.env.local`

**Note**: You'll need to add credits to your OpenAI account. Embeddings cost ~$0.001 per document, and quiz generation costs ~$0.01-0.05 per quiz depending on length.

### 6. Run the Development Server

\`\`\`bash
npm run dev
\`\`\`

Open http://localhost:3000 in your browser.

You should see the QuizBolt landing page!

---

## Environment Variables

### Required Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key | Supabase Dashboard → Settings → API → Project API keys → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side only) | Supabase Dashboard → Settings → API → Project API keys → `service_role` (⚠️ Keep secret!) |
| `OPENAI_API_KEY` | OpenAI API key | https://platform.openai.com/api-keys |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DEV_FAKE_OPENAI` | Use fake embeddings (no API costs) | `0` (disabled) |
| `NEXT_PUBLIC_APP_URL` | App URL for production | Auto-detected |

---

## Database Setup

### Migrations Overview

The database schema is defined in migration files under `supabase/migrations/`. These must be applied in order:

1. **002_quiz_schema.sql** - Quiz tables and RLS policies
2. **003_flashcard_schema.sql** - Flashcard tables
3. **004_notes_schema.sql** - Notes tables
4. **005_add_source_type.sql** - Document source type field
5. **006_analytics_schema.sql** - Analytics and tracking tables

### Running Migrations (Cloud)

**Via Supabase Dashboard**:
1. Go to SQL Editor
2. Copy each migration file content
3. Execute in order

**Via Supabase CLI** (if connected):
\`\`\`bash
supabase db push
\`\`\`

### Running Migrations (Local)

\`\`\`bash
# Apply all migrations
supabase db push

# Reset database (⚠️ destroys all data)
supabase db reset
\`\`\`

### Verify Database Setup

Run this SQL in the Supabase SQL Editor:

\`\`\`sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected tables:
-- - documents
-- - document_chunks
-- - flashcard_decks
-- - flashcard_reviews
-- - flashcards
-- - notes
-- - quiz_attempt_answers
-- - quiz_attempts
-- - quiz_questions
-- - quizzes
\`\`\`

---

## Seeding Test Data (Optional)

For local development, you may want seed data:

\`\`\`bash
# Create a seed.sql file (example)
\`\`\`

\`\`\`sql
-- supabase/seed.sql
-- Insert test user (use your Supabase user ID)
INSERT INTO documents (id, user_id, title, source_type, raw_text) 
VALUES (
  gen_random_uuid(),
  'your-user-id-here',
  'Test Document',
  'text',
  'This is a test document about machine learning and artificial intelligence.'
);
\`\`\`

Load seed data:
\`\`\`bash
supabase db load supabase/seed.sql
\`\`\`

---

## Using Supabase Locally vs Cloud

### Local Supabase

**Pros**:
- Free (no usage limits)
- Fast development (no network latency)
- Full database control

**Cons**:
- Requires Docker
- Must run `supabase start` every time
- Data is local only

**When to use**: During active development

### Cloud Supabase

**Pros**:
- No Docker required
- Accessible from anywhere
- Production-ready
- Free tier: 500MB database, 50,000 monthly active users

**Cons**:
- Usage limits on free tier
- Requires internet connection

**When to use**: Production, team collaboration, or if you don't want Docker

---

## Verifying Installation

### 1. Check Next.js Server

After running `npm run dev`, you should see:

\`\`\`
▲ Next.js 14.1.0
- Local:        http://localhost:3000
✓ Ready in 2.5s
\`\`\`

### 2. Test Supabase Connection

Open http://localhost:3000/api/health (create this test endpoint):

\`\`\`typescript
// app/api/health/route.ts
import { createServerSupabaseClient } from "@/supabase/server";

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("documents").select("count");
  
  if (error) {
    return Response.json({ status: "error", message: error.message }, { status: 500 });
  }
  
  return Response.json({ 
    status: "ok", 
    supabase: "connected",
    timestamp: new Date().toISOString()
  });
}
\`\`\`

Visit http://localhost:3000/api/health - should return `{"status":"ok"}`

### 3. Test OpenAI Connection

\`\`\`typescript
// Test in browser console (DevTools)
fetch("/api/test-openai").then(r => r.json()).then(console.log);
\`\`\`

### 4. Test Complete Flow

1. Sign up for an account at http://localhost:3000/signup
2. Upload a test PDF or paste text
3. Generate a quiz
4. Take the quiz
5. View analytics

If all steps work, your installation is complete! ✅

---

## Common Issues & Solutions

### Issue: `Module not found` errors

**Solution**:
\`\`\`bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
\`\`\`

### Issue: `OPENAI_API_KEY not set`

**Solution**: Ensure `.env.local` exists and contains the API key. Restart dev server after adding it.

### Issue: `Supabase connection failed`

**Solution**:
1. Check if Supabase project is active (cloud) or running (local)
2. Verify environment variables are correct
3. Check if RLS policies are blocking access (temporarily disable for testing)

### Issue: `pgvector extension not found`

**Solution**:
\`\`\`sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
\`\`\`

### Issue: PDF upload fails

**Solution**: Ensure Supabase Edge Function `parse-pdf` isdeployed:
\`\`\`bash
supabase functions deploy parse-pdf
\`\`\`

### Issue: Charts not displaying

**Solution**: Chart.js may need client-side rendering:
\`\`\`typescript
// Use dynamic import
const Chart = dynamic(() => import("react-chartjs-2"), { ssr: false });
\`\`\`

---

## Development Workflow

### Starting Development

\`\`\`bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2 (if using local Supabase): Start Supabase
supabase start

# Terminal 3 (optional): Watch Tailwind
npm run dev:css
\`\`\`

### Making Changes

1. **Edit code** - Changes hot-reload automatically
2. **Add dependencies** - `npm install <package>`
3. **Database changes** - Create new migration file
4. **Test** - Manual testing in browser

### Creating New Migrations

\`\`\`bash
# Create new migration file
supabase migration new your_migration_name

# Edit the file in supabase/migrations/
# Then apply it
supabase db push
\`\`\`

---

## Testing Strategies

### Manual Testing Checklist

- [ ] User can sign up/login
- [ ] User can upload PDF/URL/text
- [ ] Document appears in library
- [ ] Quiz generation works
- [ ] Quiz can be taken and submitted
- [ ] Flashcard generation works
- [ ] Flashcard review works with spaced repetition
- [ ] AI chat responds with context
- [ ] Analytics dashboard displays metrics
- [ ] Export to PDF/DOCX works

### API Testing

Use `curl` or Postman to test API endpoints:

\`\`\`bash
# Test quiz export
curl http://localhost:3000/api/quizzes/YOUR_QUIZ_ID/export/pdf \
  -o test-quiz.pdf

# Verify PDF is valid
file test-quiz.pdf
\`\`\`

---

## Deployment

See [Deployment Guide](../supabase/DEPLOYMENT.md) for production deployment to Vercel.

Quick steps:
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

---

## Getting Help

### Resources

- **Documentation**: See other files in `/docs`
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **OpenAI Docs**: https://platform.openai.com/docs

### Troubleshooting Steps

1. Check browser console for errors
2. Check terminal for server errors
3. Verify environment variables
4. Check Supabase logs (Dashboard → Logs)
5. Review migration SQL for errors

---

## Next Steps

- ✅ Installation complete!
- 📖 Read [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) to understand the system
- 🔒 Review [SECURITY_BEFORE_GITHUB.md](./SECURITY_BEFORE_GITHUB.md) before committing
- 🏗️ Explore [REPOSITORY_STRUCTURE.md](./REPOSITORY_STRUCTURE.md) to navigate the code
- 🚀 Start building features using Layer 1, 2, 3 documentation

---

## Team Onboarding

If you're a new team member:

1. Complete installation steps above
2. Review all documentation in `/docs`
3. Run the app locally and explore features
4. Pick a starter task from GitHub Issues
5. Ask questions in team chat

Welcome to QuizBolt! 🎓
