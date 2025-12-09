# QuizBolt 🎓

> **AI-Powered Learning Platform** - Transform documents into interactive quizzes, flashcards, and AI-generated notes using RAG and GPT-4.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-orange?logo=openai)](https://openai.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📖 What is QuizBolt?

QuizBolt is an intelligent learning platform that leverages **Retrieval-Augmented Generation (RAG)** and **Large Language Models (LLMs)** to transform any document (PDF, URL, or text) into personalized study materials. Upload your lecture notes, textbooks, or articles, and instantly generate:

- **📝 Interactive Quizzes** - AI-generated multiple-choice questions
- **🗂️ Flashcards** - Spaced-repetition cards for better retention
- **📄 AI Notes** - Structured summaries and key points
- **💬 AI Chat** - Conversational Q&A with your documents
- **📊 Analytics** - Track progress, insights, and performance trends

---

## ✨ Key Features

### 🧠 AI-Powered Content Generation

- **Smart Quiz Creation**: Generate contextually accurate quizzes from your documents using GPT-4 function calling
- **Adaptive Difficulty**: Choose between easy, medium, and hard questions
- **Explanations**: Every question includes AI-generated explanations

### 📚 Multi-Format Support

- **PDF Upload**: Extract text from textbooks, papers, and documents
- **URL Import**: Fetch content from web articles and blog posts
- **Direct Text**: Paste content directly into the platform

### 🔄 Spaced Repetition

- **SM-2 Algorithm**: Scientifically-proven flashcard review system
- **Intelligent Scheduling**: Cards appear when you need to review them
- **Progress Tracking**: Monitor mastery levels for each topic

### 💡 RAG-Powered Chat

- **Context-Aware Responses**: Ask questions and get answers backed by your uploaded documents
- **Semantic Search**: Find relevant information using vector similarity
- **Streaming Responses**: Real-time conversational interface

### 📈 Learning Analytics

- **Performance Metrics**: Track quiz scores, study time, and progress
- **Topic Mastery**: Identify strong areas and topics needing practice
- **Weekly Streaks**: Maintain study consistency
- **Insights Engine**: Get personalized recommendations

---

## 🛠️ Tech Stack

### Frontend & Framework

- **[Next.js 14](https://nextjs.org/)** (App Router) - React framework with server-side rendering
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful, accessible components
- **[Framer Motion](https://www.framer.com/motion/)** - Smooth animations

### Backend & Database

- **[Supabase](https://supabase.com/)** - PostgreSQL database with real-time subscriptions
- **[pgvector](https://github.com/pgvector/pgvector)** - Vector similarity search
- **Row-Level Security (RLS)** - Secure, multi-tenant data isolation

### AI & Machine Learning

- **[OpenAI GPT-4](https://openai.com/)** - Quiz, flashcard, and note generation
- **[text-embedding-3-small](https://platform.openai.com/docs/guides/embeddings)** - Document embeddings (1536 dimensions)
- **Cosine Similarity** - Semantic document retrieval

### PDF & Document Processing

- **[pdf-parse](https://www.npmjs.com/package/pdf-parse)** - PDF text extraction
- **[pdf-lib](https://pdf-lib.js.org/)** - PDF generation for exports
- **[docx](https://www.npmjs.com/package/docx)** - DOCX file generation

### State Management & Data Fetching

- **[Zustand](https://zustand-demo.pmnd.rs/)** - Lightweight state management
- **[TanStack Query](https://tanstack.com/query/)** - Server state caching and synchronization

---

## 🏗️ Architecture Overview

QuizBolt uses a **three-layer architecture**:

\`\`\`
┌─────────────────────────────────────────────────────┐
│                   Layer 3: Analytics                │
│        (Tracking, Insights, Performance Metrics)    │
└─────────────────────────────────────────────────────┘
                          ▲
┌─────────────────────────────────────────────────────┐
│                Layer 2: AI Features                 │
│     (Quiz, Flashcards, Notes, Chat, Evaluation)    │
└─────────────────────────────────────────────────────┘
                          ▲
┌─────────────────────────────────────────────────────┐
│              Layer 1: RAG Pipeline                  │
│  (Ingestion → Clean → Chunk → Embed → Store)       │
└─────────────────────────────────────────────────────┘
\`\`\`

### Data Flow

\`\`\`mermaid
graph TD
    A[User Upload PDF/URL/Text] --> B[Extract & Clean Text]
    B --> C[Split into Chunks]
    C --> D[Generate Embeddings]
    D --> E[Store in pgvector]
    
    F[User Request Quiz] --> G[Semantic Search]
    E --> G
    G --> H[Build Context]
    H --> I[Generate with GPT-4]
    I --> J[Store Results]
    J --> K[Display to User]
\`\`\`

For detailed architecture, see [ARCHITECTURE_OVERVIEW.md](./docs/ARCHITECTURE_OVERVIEW.md).

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18.17+ and npm 9+
- Supabase account (free tier available)
- OpenAI API key

### Installation

1. **Clone the repository**

\`\`\`bash
git clone https://github.com/your-username/quizbolt.git
cd quizbolt/quizbolt-frontend
\`\`\`

2. **Install dependencies**

\`\`\`bash
npm install
\`\`\`

3. **Set up environment variables**

Create `.env.local`:

\`\`\`bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key
\`\`\`

4. **Set up database**

Run the migrations in your Supabase SQL Editor:
- `supabase/migrations/002_quiz_schema.sql`
- `supabase/migrations/003_flashcard_schema.sql`
- `supabase/migrations/004_notes_schema.sql`
- `supabase/migrations/005_add_source_type.sql`
- `supabase/migrations/006_analytics_schema.sql`

5. **Run the development server**

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) 🎉

For detailed setup instructions, see [SETUP_AND_INSTALLATION.md](./docs/SETUP_AND_INSTALLATION.md).

---

## 📸 Screenshots

> **Note**: Add screenshots of your application here

\`\`\`
[Dashboard Screenshot]
[Quiz Generation Screenshot]
[Chat Interface Screenshot]
[Analytics Dashboard Screenshot]
\`\`\`

---

## 📚 Documentation

Comprehensive documentation is available in the `/docs` directory:

| Document | Description |
|----------|-------------|
| [**ARCHITECTURE_OVERVIEW.md**](./docs/ARCHITECTURE_OVERVIEW.md) | System design, tech stack, data flows |
| [**LAYER1_RAG_PIPELINE.md**](./docs/LAYER1_RAG_PIPELINE.md) | Document ingestion, embedding, retrieval |
| [**LAYER2_AI_FEATURES.md**](./docs/LAYER2_AI_FEATURES.md) | Quiz, flashcard, chat implementation |
| [**LAYER3_ANALYTICS.md**](./docs/LAYER3_ANALYTICS.md) | Tracking, insights, performance metrics |
| [**REPOSITORY_STRUCTURE.md**](./docs/REPOSITORY_STRUCTURE.md) | Codebase organization guide |
| [**SETUP_AND_INSTALLATION.md**](./docs/SETUP_AND_INSTALLATION.md) | Installation and onboarding |
| [**SECURITY_BEFORE_GITHUB.md**](./docs/SECURITY_BEFORE_GITHUB.md) | Security best practices |

---

## 🗂️ Project Structure

\`\`\`
quizbolt-frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Main application
│   ├── (public)/          # Landing pages
│   ├── actions/           # Server Actions
│   └── api/               # API Routes
├── components/            # React components
│   ├── ui/               # Base components (shadcn)
│   ├── dashboard/        # Dashboard components
│   ├── quiz/             # Quiz components
│   └── flashcards/       # Flashcard components
├── lib/                   # Core libraries
│   ├── rag/              # RAG pipeline
│   ├── supabase/         # Database clients
│   └── llm/              # LLM utilities
├── supabase/             # Database configuration
│   ├── migrations/       # SQL migrations
│   └── functions/        # Edge Functions
└── docs/                 # Documentation
\`\`\`

See [REPOSITORY_STRUCTURE.md](./docs/REPOSITORY_STRUCTURE.md) for detailed explanations.

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**

\`\`\`bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/quizbolt.git
git push -u origin main
\`\`\`

2. **Import in Vercel**

- Go to [vercel.com](https://vercel.com)
- Click "Import Project"
- Select your GitHub repository
- Add environment variables (from `.env.local`)
- Deploy!

3. **Set up Supabase Edge Functions**

\`\`\`bash
supabase functions deploy parse-pdf
\`\`\`

For detailed deployment instructions, see [supabase/DEPLOYMENT.md](./supabase/DEPLOYMENT.md).

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style (TypeScript, ESLint, Prettier)
- Write meaningful commit messages
- Update documentation for new features
- Test your changes thoroughly
- **Never commit API keys or secrets** (see [SECURITY_BEFORE_GITHUB.md](./docs/SECURITY_BEFORE_GITHUB.md))

---

## 📊 Roadmap

- [x] Core RAG pipeline with pgvector
- [x] Quiz generation with GPT-4
- [x] Flashcard system with SM-2 algorithm
- [x] AI chat with streaming responses
- [x] Learning analytics dashboard
- [x] PDF and DOCX export
- [ ] Multi-language support
- [ ] Voice notes transcription
- [ ] Collaborative study groups
- [ ] Mobile app (React Native)
- [ ] Browser extension for web content
- [ ] Advanced analytics (heatmaps, learning curves)

---

## 🛡️ Security

- **Row-Level Security (RLS)**: All database tables enforce user-level access control
- **Environment Variables**: Sensitive keys are never committed to git
- **API Key Protection**: Server-side only OpenAI and Supabase service keys
- **HTTPS Only**: All production traffic encrypted

See [SECURITY_BEFORE_GITHUB.md](./docs/SECURITY_BEFORE_GITHUB.md) for complete security guidelines.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [OpenAI](https://openai.com/) - GPT-4 and embeddings API
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful component library
- [Vercel](https://vercel.com/) - Hosting and deployment

---

## 📞 Support

- **Documentation**: [/docs](./docs)
- **Issues**: [GitHub Issues](https://github.com/your-username/quizbolt/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/quizbolt/discussions)

---

## 🌟 Star History

If you find QuizBolt helpful, please consider giving it a star ⭐

---

**Built with ❤️ using Next.js, Supabase, and OpenAI**

---

## Quick Links

- 📖 [Documentation](./docs/)
- 🚀 [Getting Started](./docs/SETUP_AND_INSTALLATION.md)
- 🏗️ [Architecture](./docs/ARCHITECTURE_OVERVIEW.md)
- 🔒 [Security](./docs/SECURITY_BEFORE_GITHUB.md)
- 🤝 [Contributing](#contributing)
