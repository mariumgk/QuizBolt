# Layer 2: AI Features Documentation

## Overview

Layer 2 builds on the RAG pipeline (Layer 1) to provide AI-powered learning features. All features use retrieved document chunks as context for GPT-4 to generate accurate, contextually relevant content.

## AI Features

1. **Quiz Generation** - MCQ quizzes from document content
2. **Flashcard Generation** - Spaced-repetition flashcards
3. **AI Notes** - Summaries and key points extraction
4. **RAG Chat** - Conversational Q&A with document context
5. **Answer Evaluation** - AI grading of short-answer responses

## Common Pattern: RAG-Powered Generation

All AI features follow this pattern:

\`\`\`mermaid
graph LR
    A[User Request] --> B[Retrieve Context]
    B --> C[Build Prompt]
    C --> D[Call OpenAI]
    D --> E[Parse Response]
    E --> F[Store in Database]
    F --> G[Return to User]
\`\`\`

---

## 1. Quiz Generation

### Overview

Generate multiple-choice questions from document content using GPT-4 function calling for structured output.

### File Path
- **Server Action**: `app/actions/generate-quiz.ts`
- **Database**: `supabase/migrations/002_quiz_schema.sql`

### Input Parameters

\`\`\`typescript
interface GenerateQuizParams {
  docId: string;
  numQuestions?: number;  // Default: 5
  difficulty?: "easy" | "medium" | "hard"; // Default: "medium"
  title?: string;
}
\`\`\`

### Implementation Flow

\`\`\`typescript
export async function generateQuiz(params: GenerateQuizParams) {
  // 1. Authenticate user
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // 2. Get document chunks from RAG pipeline
  const chunks = await getDocumentChunks(params.docId);
  const context = buildContextFromChunks(chunks);
  
  // 3. Build generation prompt
  const systemPrompt = `You are a quiz generator. Create ${params.numQuestions} multiple-choice questions based on the provided context. Difficulty level: ${params.difficulty}.`;
  
  // 4. Call OpenAI with function calling
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: context }
    ],
    functions: [{
      name: "create_quiz",
      description: "Generate a quiz with multiple choice questions",
      parameters: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                questionText: { type: "string" },
                options: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 4,
                  maxItems: 4
                },
                correctOption: {
                  type: "number",
                  minimum: 0,
                  maximum: 3
                },
                explanation: { type: "string" }
              },
              required: ["questionText", "options", "correctOption"]
            }
          }
        }
      }
    }],
    function_call: { name: "create_quiz" }
  });
  
  // 5. Parse function call result
  const functionCall = response.choices[0]?.message?.function_call;
  const quizData = JSON.parse(functionCall?.arguments || "{}");
  
  // 6. Store quiz in database
  const { data: quiz } = await supabase
    .from("quizzes")
    .insert({
      user_id: user.id,
      doc_id: params.docId,
      title: params.title || "Generated Quiz",
      num_questions: quizData.questions.length
    })
    .select()
    .single();
  
  // 7. Store questions
  const questions = quizData.questions.map((q, idx) => ({
    quiz_id: quiz.id,
    question_text: q.questionText,
    options: q.options,
    correct_option: q.correctOption,
    explanation: q.explanation,
    order_index: idx
  }));
  
  await supabase.from("quiz_questions").insert(questions);
  
  return { quizId: quiz.id, ...quiz };
}
\`\`\`

### Function Calling Schema

\`\`\`json
{
  "name": "create_quiz",
  "description": "Generate a quiz with multiple choice questions",
  "parameters": {
    "type": "object",
    "properties": {
      "questions": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "questionText": { "type": "string" },
            "options": {
              "type": "array",
              "items": { "type": "string" },
              "minItems": 4,
              "maxItems": 4
            },
            "correctOption": {
              "type": "number",
              "description": "Index of correct option (0-3)"
            },
            "explanation": { "type": "string" }
          },
          "required": ["questionText", "options", "correctOption"]
        }
      }
    }
  }
}
\`\`\`

### Database Schema

\`\`\`sql
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  doc_id UUID REFERENCES documents(id),
  title TEXT NOT NULL,
  num_questions INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of 4 strings
  correct_option INTEGER CHECK (correct_option BETWEEN 0 AND 3),
  explanation TEXT,
  order_index INTEGER NOT NULL
);
\`\`\`

### Error Handling

\`\`\`typescript
try {
  const quiz = await generateQuiz({ docId: "..." });
} catch (error) {
  if (error.message.includes("OPENAI_API_KEY")) {
    // Missing API key
  } else if (error.message.includes("function_call")) {
    // Invalid function call response
  } else if (error.code === "PGRST116") {
    // Document not found
  }
}
\`\`\`

### Testing

\`\`\`typescript
// Test quiz generation
const quiz = await generateQuiz({
  docId: "test-doc-id",
  numQuestions: 3,
  difficulty: "easy",
  title: "Test Quiz"
});

console.assert(quiz.quizId, "Should return quiz ID");
console.assert(quiz.num_questions === 3, "Should generate 3 questions");
\`\`\`

---

## 2. Flashcard Generation

### Overview

Generate spaced-repetition flashcards from document content.

### File Path
- **Server Action**: `app/actions/generate-flashcards.ts`
- **Database**: `supabase/migrations/003_flashcard_schema.sql`

### Implementation

\`\`\`typescript
export async function generateFlashcards(params: {
  docId: string;
  numCards?: number; // Default: 10
}): Promise<{ deckId: string }> {
  // Similar to quiz generation:
  // 1. Retrieve context
  const chunks = await getDocumentChunks(params.docId);
  const context = buildContextFromChunks(chunks);
  
  // 2. Call OpenAI with function calling
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "Generate flashcards for spaced repetition learning."
      },
      { role: "user", content: context }
    ],
    functions: [{
      name: "create_flashcards",
      parameters: {
        type: "object",
        properties: {
          cards: {
            type: "array",
            items: {
              type: "object",
              properties: {
                front: { type: "string", description: "Question or prompt" },
                back: { type: "string", description: "Answer or explanation" },
                hint: { type: "string", description: "Optional hint" }
              },
              required: ["front", "back"]
            }
          }
        }
      }
    }],
    function_call: { name: "create_flashcards" }
  });
  
  // 3. Parse and store
  const functionCall = response.choices[0]?.message?.function_call;
  const cardsData = JSON.parse(functionCall?.arguments || "{}");
  
  // 4. Store in database
  const { data: deck } = await supabase
    .from("flashcard_decks")
    .insert({
      user_id: user.id,
      doc_id: params.docId,
      title: "Generated Flashcards",
      total_cards: cardsData.cards.length
    })
    .select()
    .single();
  
  const cards = cardsData.cards.map((card, idx) => ({
    deck_id: deck.id,
    front: card.front,
    back: card.back,
    hint: card.hint,
    order_index: idx,
    // Spaced repetition fields
    ease_factor: 2.5,
    interval: 1,
    next_review: new Date()
  }));
  
  await supabase.from("flashcards").insert(cards);
  
  return { deckId: deck.id };
}
\`\`\`

### Spaced Repetition Schema

\`\`\`sql
CREATE TABLE flashcards (
  id UUID PRIMARY KEY,
  deck_id UUID REFERENCES flashcard_decks(id),
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  hint TEXT,
  order_index INTEGER,
  -- SM-2 algorithm fields
  ease_factor NUMERIC DEFAULT 2.5,
  interval INTEGER DEFAULT 1,
  repetitions INTEGER DEFAULT 0,
  next_review TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

---

## 3. AI Notes (Summaries)

### Overview

Generate hierarchical notes with key points from document content.

### File Path
- **Server Action**: `app/actions/generate-notes.ts`

### Implementation

\`\`\`typescript
export async function generateNotes(params: {
  docId: string;
  style?: "brief" | "detailed"; // Default: "detailed"
}): Promise<{ noteId: string }> {
  const chunks = await getDocumentChunks(params.docId);
  const context = buildContextFromChunks(chunks);
  
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: "Generate structured notes with headings and key points."
      },
      { role: "user", content: context }
    ],
    functions: [{
      name: "create_notes",
      parameters: {
        type: "object",
        properties: {
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                heading: { type: "string" },
                keyPoints: {
                  type: "array",
                  items: { type: "string" }
                },
                summary: { type: "string" }
              }
            }
          }
        }
      }
    }],
    function_call: { name: "create_notes" }
  });
  
  // Parse and store notes
  const notesData = JSON.parse(response.choices[0]?.message?.function_call?.arguments || "{}");
  
  const { data: note } = await supabase
    .from("notes")
    .insert({
      user_id: user.id,
      doc_id: params.docId,
      title: "AI-Generated Notes",
      content: notesData, // JSONB field
      created_at: new Date()
    })
    .select()
    .single();
  
  return { noteId: note.id };
}
\`\`\`

---

## 4. RAG Chat

### Overview

Conversational Q&A with document context using streaming responses.

### File Path
- **Server Action**: `app/actions/rag-chat.ts`

### Implementation

\`\`\`typescript
export async function ragChat(params: {
  docId: string;
  message: string;
  chatHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<ReadableStream> {
  // 1. Retrieve relevant chunks for user's message
  const chunks = await retrieveChunks({
    documentId: params.docId,
    query: params.message,
    topK: 5
  });
  
  const context = chunks.map(c => c.chunkText).join("\n\n");
  
  // 2. Build messages with context
  const messages = [
    {
      role: "system",
      content: `You are a helpful assistant. Answer the user's question based on the following context:\n\n${context}`
    },
    ...(params.chatHistory || []),
    {
      role: "user",
      content: params.message
    }
  ];
  
  // 3. Stream response
  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: messages,
    stream: true,
  });
  
  // 4. Convert OpenAI stream to Web ReadableStream
  const stream = OpenAIStream(response);
  return stream;
}
\`\`\`

### Client-Side Streaming

\`\`\`typescript
// In React component
import { useChat } from "@/lib/hooks/use-chat";

function ChatInterface({ docId }) {
  const { messages, input, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    body: { docId }
  });
  
  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>
          <strong>{msg.role}:</strong> {msg.content}
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={e => setInput(e.target.value)} />
        <button disabled={isLoading}>Send</button>
      </form>
    </div>
  );
}
\`\`\`

---

## 5. Answer Evaluation

### Overview

AI-powered grading of short-answer responses.

### File Path
- **Server Action**: `app/actions/submit-quiz.ts` (integrated)

### Implementation

\`\`\`typescript
export async function evaluateAnswer(params: {
  question: string;
  correctAnswer: string;
  userAnswer: string;
}): Promise<{
  isCorrect: boolean;
  score: number; // 0-100
  feedback: string;
}> {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo", // Cheaper for simple evaluation
    messages: [
      {
        role: "system",
        content: "You are a teacher grading student answers. Provide a score (0-100) and constructive feedback."
      },
      {
        role: "user",
        content: `
Question: ${params.question}
Expected Answer: ${params.correctAnswer}
Student Answer: ${params.userAnswer}

Evaluate the student's answer.
        `
      }
    ],
    functions: [{
      name: "grade_answer",
      parameters: {
        type: "object",
        properties: {
          isCorrect: { type: "boolean" },
          score: { type: "number", minimum: 0, maximum: 100 },
          feedback: { type: "string" }
        },
        required: ["isCorrect", "score", "feedback"]
      }
    }],
    function_call: { name: "grade_answer" }
  });
  
  const result = JSON.parse(response.choices[0]?.message?.function_call?.arguments || "{}");
  return result;
}
\`\`\`

---

## API Usage Patterns

### Cost Optimization

\`\`\`typescript
// Use cheaper models for simpler tasks
const MODEL_CONFIG = {
  quiz: "gpt-4-turbo-preview",      // Complex reasoning
  flashcards: "gpt-4-turbo-preview", // Quality matters
  notes: "gpt-4-turbo-preview",      // Summarization
  chat: "gpt-3.5-turbo",             // Fast responses
  evaluation: "gpt-3.5-turbo"        // Simple grading
};
\`\`\`

### Rate Limiting

\`\`\`typescript
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 requests per minute
});

export async function generateQuiz(params) {
  const { success } = await ratelimit.limit(userId);
  if (!success) throw new Error("Rate limit exceeded");
  
  // ... proceed with generation
}
\`\`\`

### Caching

\`\`\`typescript
// Cache generated content to avoid regeneration
const CACHE_TTL = 60 * 60; // 1 hour

export async function generateQuiz(params) {
  const cacheKey = `quiz:${params.docId}:${params.numQuestions}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) return JSON.parse(cached);
  
  const quiz = await generateQuizInternal(params);
  await redis.set(cacheKey, JSON.stringify(quiz), { ex: CACHE_TTL });
  
  return quiz;
}
\`\`\`

---

## Error Handling Strategy

### Retry Logic

\`\`\`typescript
async function callOpenAIWithRetry(fn: () => Promise<any>, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429) {
        // Rate limit - exponential backoff
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
      } else if (error.status >= 500) {
        // Server error - retry
        await new Promise(r => setTimeout(r, 1000));
      } else {
        throw error; // Client error - don't retry
      }
    }
  }
  throw new Error("Max retries exceeded");
}
\`\`\`

### Validation

\`\`\`typescript
import { z } from "zod";

const QuizQuestionSchema = z.object({
  questionText: z.string().min(10),
  options: z.array(z.string()).length(4),
  correctOption: z.number().min(0).max(3),
  explanation: z.string().optional()
});

// Validate OpenAI function call response
function parseQuizResponse(functionCall: any) {
  const data = JSON.parse(functionCall.arguments);
  const validated = z.array(QuizQuestionSchema).parse(data.questions);
  return validated;
}
\`\`\`

---

## Testing Recommendations

### Unit Tests

\`\`\`typescript
// Test quiz generation logic
describe("generateQuiz", () => {
  it("should generate correct number of questions", async () => {
    const quiz = await generateQuiz({
      docId: "test-doc",
      numQuestions: 5
    });
    
    expect(quiz.questions.length).toBe(5);
  });
  
  it("should include explanations", async () => {
    const quiz = await generateQuiz({ docId: "test-doc" });
    quiz.questions.forEach(q => {
      expect(q.explanation).toBeDefined();
    });
  });
});
\`\`\`

### Integration Tests

\`\`\`typescript
// Test end-to-end flow
it("should generate quiz from uploaded document", async () => {
  // 1. Upload document
  const doc = await ingestDocument({
    title: "Test",
    sourceType: "text",
    content: "Machine learning is..."
  });
  
  // 2. Generate quiz
  const quiz = await generateQuiz({
    docId: doc.documentId,
    numQuestions: 3
  });
  
  // 3. Verify results
  expect(quiz.quizId).toBeDefined();
  expect(quiz.questions.length).toBe(3);
});
\`\`\`

---

## Code Flow Chart: Quiz Generation

\`\`\`
┌─────────────────┐
│   User Request  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ Server Action:          │
│ generateQuiz()          │
└────────┬────────────────┘
         │
         │ 1. Auth Check
         ▼
┌─────────────────────────┐
│ Supabase Auth          │
│ Verify user session    │
└────────┬────────────────┘
         │
         │ 2. Retrieve Context
         ▼
┌─────────────────────────┐
│ lib/rag/retrieve.ts    │
│ Get document chunks    │
└────────┬────────────────┘
         │
         │ 3. Build Prompt
         ▼
┌─────────────────────────┐
│ lib/rag/context.ts     │
│ Combine chunks         │
└────────┬────────────────┘
         │
         │ 4. Call OpenAI
         ▼
┌─────────────────────────┐
│ OpenAI API             │
│ GPT-4 function calling │
└────────┬────────────────┘
         │
         │ 5. Parse Response
         ▼
┌─────────────────────────┐
│ Validate JSON schema   │
│ Extract questions      │
└────────┬────────────────┘
         │
         │ 6. Store Results
         ▼
┌─────────────────────────┐
│ Supabase               │
│ Insert quiz + questions│
└────────┬────────────────┘
         │
         │ 7. Return to UI
         ▼
┌─────────────────────────┐
│ React Component        │
│ Display quiz           │
└─────────────────────────┘
\`\`\`

---

## Next Steps

- See [LAYER3_ANALYTICS.md](./LAYER3_ANALYTICS.md) for tracking user interactions
- See [app/actions/](../app/actions/) for complete server action implementations
- See [API Safety Best Practices](./SECURITY_BEFORE_GITHUB.md)
