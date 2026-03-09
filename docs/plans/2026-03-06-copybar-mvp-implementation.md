# Capybara MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full-stack AI-powered market research platform where customers test sales pitches against digital clones in real-time.

**Architecture:** Three-tier system (Frontend → Backend → Supabase + DeepSeek). Frontend routes between landing/auth pages and protected chat product. Backend orchestrates message flow between customer and Capybara AI (orchestrator) or digital clones. Capybara AI drives all intelligence via DeepSeek prompting.

**Tech Stack:** React 18 + TypeScript + Vite (frontend), Express + TypeScript (backend), Supabase (database/auth), DeepSeek API (LLM)

---

## Phase 1: Database Setup

### Task 1: Create Supabase Database Tables

**Files:**
- Create: `docs/migrations/001-initial-schema.sql`
- Modify: `.env.example` (add Supabase secrets)

**Step 1: Create migration file with all table definitions**

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  google_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  approved BOOLEAN DEFAULT false
);

-- Create waitlist table
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT now(),
  approved_at TIMESTAMP
);

-- Create clones table
CREATE TABLE clones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  persona_description TEXT,
  system_prompt TEXT NOT NULL,
  category TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT now()
);

-- Create chat_sessions table
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  mode TEXT NOT NULL CHECK (mode IN ('god', 'conversation')),
  active_clones JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create chat_messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'capybara', 'clone')),
  sender_id TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_approved ON users(approved);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
```

**Step 2: Run migration in Supabase dashboard**

Go to Supabase SQL editor and paste the migration. Execute it.

Expected: All tables created successfully with no errors.

**Step 3: Add environment variables**

Create `.env.example`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DEEPSEEK_API_KEY=your-deepseek-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

Copy to `.env` locally and fill in actual values.

**Step 4: Commit**

```bash
git add docs/migrations/001-initial-schema.sql .env.example
git commit -m "feat: add supabase database schema and migrations"
```

---

### Task 2: Initialize Supabase Client in Shared Package

**Files:**
- Create: `shared/src/db.ts`
- Modify: `shared/src/index.ts`

**Step 1: Create Supabase client wrapper**

```typescript
// shared/src/db.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: { id: string; email: string; google_id: string; created_at: string; approved: boolean }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      waitlist: {
        Row: { id: string; user_id: string; joined_at: string; approved_at: string | null }
        Insert: Omit<Database['public']['Tables']['waitlist']['Row'], 'id' | 'joined_at'>
        Update: Partial<Database['public']['Tables']['waitlist']['Insert']>
      }
      clones: {
        Row: { id: string; name: string; persona_description: string | null; system_prompt: string; category: string | null; tags: Record<string, any>; created_at: string }
        Insert: Omit<Database['public']['Tables']['clones']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['clones']['Insert']>
      }
      chat_sessions: {
        Row: { id: string; user_id: string; created_at: string; mode: 'god' | 'conversation'; active_clones: Record<string, any>; metadata: Record<string, any> }
        Insert: Omit<Database['public']['Tables']['chat_sessions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['chat_sessions']['Insert']>
      }
      chat_messages: {
        Row: { id: string; session_id: string; role: 'user' | 'capybara' | 'clone'; sender_id: string | null; content: string; created_at: string }
        Insert: Omit<Database['public']['Tables']['chat_messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['chat_messages']['Insert']>
      }
    }
  }
}
```

**Step 2: Export from shared index**

Add to `shared/src/index.ts`:
```typescript
export { supabase, type Database } from './db'
```

**Step 3: Install Supabase dependency**

```bash
npm install @supabase/supabase-js --workspace=shared
```

**Step 4: Commit**

```bash
git add shared/src/db.ts shared/src/index.ts package.json
git commit -m "feat: add supabase client to shared package"
```

---

## Phase 2: Backend Authentication

### Task 3: Set Up Google OAuth Endpoints

**Files:**
- Create: `backend/src/routes/auth.ts`
- Modify: `backend/src/index.ts`

**Step 1: Create auth routes file**

```typescript
// backend/src/routes/auth.ts
import { Router, Request, Response } from 'express'
import { supabase } from '../../shared/src/db'

const router = Router()

interface GoogleTokenPayload {
  email: string
  sub: string
  name?: string
}

/**
 * POST /auth/google
 * Exchange Google ID token for session
 */
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ error: 'Missing token' })
    }

    // Verify token with Google (simplified - in production use google-auth-library)
    // For now, trust the frontend JWT decoding
    const googleId = extractGoogleId(token)
    const email = extractEmail(token)

    if (!googleId || !email) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Get or create user
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('google_id', googleId)
      .single()

    if (userError && userError.code !== 'PGRST116') {
      throw userError
    }

    if (!user) {
      // Create new user + add to waitlist
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({ email, google_id: googleId, approved: false })
        .select()
        .single()

      if (createError) throw createError

      // Add to waitlist
      await supabase.from('waitlist').insert({ user_id: newUser.id })

      user = newUser
    }

    // Return user + approval status
    res.json({
      user_id: user.id,
      email: user.email,
      approved: user.approved,
      session_token: generateSessionToken(user.id),
    })
  } catch (error) {
    console.error('Auth error:', error)
    res.status(500).json({ error: 'Authentication failed' })
  }
})

/**
 * POST /auth/logout
 * Clear session
 */
router.post('/logout', (req: Request, res: Response) => {
  // Session tokens managed client-side in localStorage
  res.json({ success: true })
})

/**
 * GET /user/profile
 * Get current user profile + approval status
 */
router.get('/user/profile', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error

    res.json(user)
  } catch (error) {
    console.error('Profile error:', error)
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

// Helper functions (placeholder)
function extractGoogleId(token: string): string | null {
  // In production, verify JWT signature with Google's public keys
  // For MVP, decode without verification (unsafe for production)
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    return payload.sub || null
  } catch {
    return null
  }
}

function extractEmail(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    return payload.email || null
  } catch {
    return null
  }
}

function generateSessionToken(userId: string): string {
  // Simple token (in production, use JWT)
  return Buffer.from(`${userId}:${Date.now()}`).toString('base64')
}

export default router
```

**Step 2: Integrate routes into main server**

In `backend/src/index.ts`:
```typescript
import authRoutes from './routes/auth'

app.use('/auth', authRoutes)
```

**Step 3: Add required middleware**

```typescript
app.use(express.json())
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-user-id')
  next()
})
```

**Step 4: Test endpoint exists**

```bash
npm run dev --workspace=backend
# Should start server on 3001 without errors
```

**Step 5: Commit**

```bash
git add backend/src/routes/auth.ts backend/src/index.ts
git commit -m "feat: add google oauth endpoints"
```

---

### Task 4: Add Authentication Middleware

**Files:**
- Create: `backend/src/middleware/auth.ts`
- Modify: `backend/src/index.ts`

**Step 1: Create auth middleware**

```typescript
// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express'

export interface AuthRequest extends Request {
  userId?: string
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'] as string

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  req.userId = userId
  next()
}

export function requireApproval(req: AuthRequest, res: Response, next: NextFunction) {
  // Check approval status (will be added in DB lookup)
  // For now, just ensure auth middleware ran first
  if (!req.userId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  next()
}
```

**Step 2: Apply middleware to protected routes**

In `backend/src/index.ts`, after defining routes, protect chat routes:
```typescript
app.use('/chat', requireAuth, requireApproval, chatRoutes)
```

**Step 3: Commit**

```bash
git add backend/src/middleware/auth.ts backend/src/index.ts
git commit -m "feat: add authentication middleware"
```

---

## Phase 3: Backend Chat Routes & LangGraph Orchestration

### Task 5: Set Up PostgreSQL Checkpoint Storage

**Files:**
- Create: `docs/migrations/002-langraph-checkpoints.sql`
- Modify: `.env.example`

**Step 1: Create checkpoint table migration**

```sql
-- docs/migrations/002-langraph-checkpoints.sql
-- LangGraph checkpoint tables for thread-based state persistence

CREATE TABLE IF NOT EXISTS checkpoint_writes (
  thread_id TEXT NOT NULL,
  checkpoint_ns TEXT NOT NULL,
  checkpoint_id TEXT NOT NULL,
  ts_created TIMESTAMP DEFAULT now(),
  ts_updated TIMESTAMP DEFAULT now(),
  checkpoint JSONB NOT NULL,
  metadata JSONB,
  parent_checkpoint_id TEXT,
  PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id)
);

CREATE TABLE IF NOT EXISTS checkpoint_blobs (
  thread_id TEXT NOT NULL,
  checkpoint_ns TEXT NOT NULL,
  checkpoint_id TEXT NOT NULL,
  key TEXT NOT NULL,
  ts_created TIMESTAMP DEFAULT now(),
  blob BYTEA NOT NULL,
  PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id, key),
  FOREIGN KEY (thread_id, checkpoint_ns, checkpoint_id)
    REFERENCES checkpoint_writes(thread_id, checkpoint_ns, checkpoint_id)
);

-- Indexes for performance
CREATE INDEX idx_checkpoint_writes_thread ON checkpoint_writes(thread_id);
CREATE INDEX idx_checkpoint_writes_ns ON checkpoint_writes(checkpoint_ns);
CREATE INDEX idx_checkpoint_blobs_thread ON checkpoint_blobs(thread_id);
```

**Step 2: Run migration in Supabase**

Go to Supabase SQL editor and execute the migration.

**Step 3: Update .env.example**

Add:
```
DATABASE_URL=postgresql://user:password@localhost:5432/capybara_ai
LANGGRAPH_STORE_URL=postgresql://user:password@localhost:5432/capybara_ai
```

**Step 4: Commit**

```bash
git add docs/migrations/002-langraph-checkpoints.sql .env.example
git commit -m "feat: add langgraph checkpoint tables for session persistence"
```

---

### Task 6: Create LangGraph Orchestrator Service

**Files:**
- Create: `backend/src/services/langgraph-orchestrator.ts`
- Create: `backend/src/services/llm.ts`
- Modify: `package.json` (add LangGraph deps)

**Step 1: Install LangGraph dependencies**

```bash
npm install @langchain/langgraph @langchain/core @langchain/openai pg --workspace=backend
```

**Step 2: Create LLM config service**

```typescript
// backend/src/services/llm.ts
import { ChatOpenAI } from '@langchain/openai'

export function createDeepSeekLLM() {
  // DeepSeek API is OpenAI-compatible
  return new ChatOpenAI({
    modelName: 'deepseek-chat',
    apiKey: process.env.DEEPSEEK_API_KEY,
    configuration: {
      baseURL: 'https://api.deepseek.com/v1',
    },
    temperature: 0.7,
  })
}

export function createCloneLLM() {
  // Same as above, but with higher temperature for variety
  return new ChatOpenAI({
    modelName: 'deepseek-chat',
    apiKey: process.env.DEEPSEEK_API_KEY,
    configuration: {
      baseURL: 'https://api.deepseek.com/v1',
    },
    temperature: 0.8,
  })
}
```

**Step 3: Create LangGraph orchestrator**

```typescript
// backend/src/services/langgraph-orchestrator.ts
import { StateGraph, START, END, MessagesState } from '@langchain/langgraph'
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages'
import { createDeepSeekLLM } from './llm'
import { supabase } from '../../shared/src/db'

const CAPYBARA_SYSTEM_PROMPT = `You are Capybara AI, an expert user research guide for founders and marketers. Your role is to:

1. Understand the user's research goals (e.g., "test my sales pitch on game developers")
2. Help them select relevant digital clones to chat with
3. Provide actionable guidance based on feedback

You are intelligent, direct, and help users get maximum insight from their digital clones. When a user asks for clones, suggest specific counts (default 5, or top 10 active, or random). Ask clarifying questions to refine their research goal.`

/**
 * Create the Capybara AI graph for orchestration
 */
export function createCapybaraGraph() {
  const llm = createDeepSeekLLM()

  const graph = new StateGraph(MessagesState)

  // Define the Capybara AI node
  const capybaraNode = async (state: MessagesState) => {
    const systemMessage = {
      role: 'system',
      content: CAPYBARA_SYSTEM_PROMPT,
    }

    const messages = [
      systemMessage,
      ...state.messages.map((msg) => ({
        role: msg._getType() === 'human' ? 'user' : 'assistant',
        content: msg.content,
      })),
    ]

    const response = await llm.invoke(state.messages)

    return {
      messages: [response],
    }
  }

  graph.addNode('capybara', capybaraNode)
  graph.addEdge(START, 'capybara')
  graph.addEdge('capybara', END)

  return graph.compile()
}

/**
 * Create a clone graph for a specific clone
 */
export async function createCloneGraph(cloneId: string) {
  const { data: clone, error } = await supabase
    .from('clones')
    .select('system_prompt')
    .eq('id', cloneId)
    .single()

  if (error || !clone) {
    throw new Error(`Clone ${cloneId} not found`)
  }

  const llm = createDeepSeekLLM()

  const graph = new StateGraph(MessagesState)

  const cloneNode = async (state: MessagesState) => {
    const response = await llm.invoke([
      { role: 'system', content: clone.system_prompt },
      ...state.messages,
    ])

    return {
      messages: [response],
    }
  }

  graph.addNode('clone', cloneNode)
  graph.addEdge(START, 'clone')
  graph.addEdge('clone', END)

  return graph.compile()
}

/**
 * Call Capybara AI with a message
 * Uses thread-based checkpointing for session memory
 */
export async function callCapybaraAI(
  threadId: string,
  userMessage: string,
  checkpointer: any
) {
  const graph = createCapybaraGraph()

  const response = await graph.invoke(
    { messages: [new HumanMessage(userMessage)] },
    { configurable: { thread_id: threadId }, checkpoint_config: { checkpointer } }
  )

  return response.messages[response.messages.length - 1].content
}

/**
 * Call a digital clone with a message
 * Each clone uses its own thread for isolated state
 */
export async function callClone(
  cloneId: string,
  threadId: string,
  userMessage: string,
  checkpointer: any
) {
  const graph = await createCloneGraph(cloneId)

  const response = await graph.invoke(
    { messages: [new HumanMessage(userMessage)] },
    { configurable: { thread_id: threadId }, checkpoint_config: { checkpointer } }
  )

  return response.messages[response.messages.length - 1].content
}

/**
 * Call multiple clones in parallel
 */
export async function callMultipleClones(
  cloneIds: string[],
  threadId: string,
  userMessage: string,
  checkpointer: any
) {
  const promises = cloneIds.map((cloneId) =>
    callClone(cloneId, threadId, userMessage, checkpointer)
      .then((content) => ({ clone_id: cloneId, content }))
      .catch((error) => {
        console.error(`Clone ${cloneId} error:`, error)
        return { clone_id: cloneId, content: '[Failed to respond]' }
      })
  )

  return Promise.all(promises)
}
```

**Step 4: Test LangGraph setup**

```bash
npm run dev --workspace=backend
# No errors on startup
```

**Step 5: Commit**

```bash
git add backend/src/services/langgraph-orchestrator.ts backend/src/services/llm.ts package.json
git commit -m "feat: add langgraph orchestration service with capybara and clone graphs"
```

---

### Task 7: Create Chat Session Routes (Using LangGraph)

**Files:**
- Create: `backend/src/routes/chat.ts`
- Modify: `backend/src/index.ts`

**Step 1: Create chat routes with LangGraph**

```typescript
// backend/src/routes/chat.ts
import { Router, Response } from 'express'
import { supabase } from '../../shared/src/db'
import { AuthRequest } from '../middleware/auth'
import {
  callCapybaraAI,
  callMultipleClones,
} from '../services/langgraph-orchestrator'
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres'

const router = Router()

// Initialize PostgreSQL checkpointer
const checkpointer = new PostgresSaver({
  connectionString: process.env.DATABASE_URL,
})

/**
 * POST /chat/init
 * Initialize a new chat session
 */
router.post('/init', async (req: AuthRequest, res: Response) => {
  try {
    const { mode } = req.body // 'god' or 'conversation'
    const userId = req.userId!

    // Validate approval status
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('approved')
      .eq('id', userId)
      .single()

    if (userError || !user?.approved) {
      return res.status(403).json({ error: 'Not approved for access' })
    }

    // Create session
    const { data: session, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        mode,
        active_clones: [],
        metadata: { thread_id: `session_${Date.now()}` },
      })
      .select()
      .single()

    if (error) throw error

    res.json(session)
  } catch (error) {
    console.error('Chat init error:', error)
    res.status(500).json({ error: 'Failed to initialize chat' })
  }
})

/**
 * POST /chat/message
 * Send a message in a chat session
 * Routes to Capybara AI or clones based on mode
 */
router.post('/message', async (req: AuthRequest, res: Response) => {
  try {
    const { session_id, content, target_clones } = req.body
    const userId = req.userId!

    // Verify session ownership
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', userId)
      .single()

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    const threadId = session.metadata.thread_id

    // Save user message
    const { data: userMessage, error: msgError } = await supabase
      .from('chat_messages')
      .insert({
        session_id,
        role: 'user',
        sender_id: userId,
        content,
      })
      .select()
      .single()

    if (msgError) throw msgError

    // Route message based on mode
    let responses = []

    if (session.mode === 'god') {
      // Send to Capybara AI (uses LangGraph thread for session memory)
      const capybaraResponse = await callCapybaraAI(threadId, content, checkpointer)

      responses = [
        {
          role: 'capybara',
          sender_id: 'capybara-ai',
          content: capybaraResponse,
        },
      ]
    } else if (session.mode === 'conversation') {
      // Send to selected clones
      const clonesInScope = target_clones || session.active_clones

      if (!clonesInScope || clonesInScope.length === 0) {
        return res.status(400).json({ error: 'No active clones in session' })
      }

      // Call all clones in parallel (each uses own thread for isolated state)
      const cloneResponses = await callMultipleClones(
        clonesInScope,
        threadId,
        content,
        checkpointer
      )

      responses = cloneResponses.map((response) => ({
        role: 'clone',
        sender_id: `User_${response.clone_id.slice(0, 4)}`,
        content: response.content,
      }))
    }

    // Save AI responses
    for (const response of responses) {
      await supabase.from('chat_messages').insert({
        session_id,
        role: response.role,
        sender_id: response.sender_id,
        content: response.content,
      })
    }

    res.json({
      user_message: userMessage,
      ai_responses: responses,
    })
  } catch (error) {
    console.error('Message error:', error)
    res.status(500).json({ error: 'Failed to process message' })
  }
})

/**
 * GET /chat/history
 * Get conversation history for a session
 */
router.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    const { session_id } = req.query
    const userId = req.userId!

    // Verify ownership
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', session_id)
      .eq('user_id', userId)
      .single()

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    // Fetch messages
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })

    if (error) throw error

    res.json(messages)
  } catch (error) {
    console.error('History error:', error)
    res.status(500).json({ error: 'Failed to fetch history' })
  }
})

export default router
```

**Step 2: Integrate chat routes**

In `backend/src/index.ts`:
```typescript
import { requireAuth, requireApproval } from './middleware/auth'
import chatRoutes from './routes/chat'

app.use('/chat', requireAuth, requireApproval, chatRoutes)
```

**Step 3: Test routes**

```bash
npm run dev --workspace=backend
# POST /chat/init should create session
# POST /chat/message should call LangGraph
```

**Step 4: Commit**

```bash
git add backend/src/routes/chat.ts backend/src/index.ts
git commit -m "feat: add chat routes with langgraph orchestration"
```

---

### Task 8: Add Clone Search Route

**Files:**
- Create: `backend/src/routes/clones.ts`
- Modify: `backend/src/index.ts`

**Step 1: Create clone search routes**

```typescript
// backend/src/routes/clones.ts
import { Router, Response } from 'express'
import { supabase } from '../../shared/src/db'
import { AuthRequest } from '../middleware/auth'

const router = Router()

/**
 * POST /clones/search
 * Search for clones matching a query
 */
router.post('/search', async (req: AuthRequest, res: Response) => {
  try {
    const { query, limit = 100 } = req.body

    if (!query) {
      return res.status(400).json({ error: 'Missing query' })
    }

    const { data: clones, error } = await supabase
      .from('clones')
      .select('id, name, persona_description, category, tags')
      .ilike('category', `%${query}%`)
      .limit(limit)

    if (error) throw error

    res.json({
      query,
      count: clones?.length || 0,
      clones,
    })
  } catch (error) {
    console.error('Clone search error:', error)
    res.status(500).json({ error: 'Failed to search clones' })
  }
})

/**
 * GET /clones/list
 * List clones in current session
 */
router.get('/list', async (req: AuthRequest, res: Response) => {
  try {
    const { session_id } = req.query

    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('active_clones')
      .eq('id', session_id)
      .single()

    if (sessionError) throw sessionError

    const cloneIds = session?.active_clones || []

    if (cloneIds.length === 0) {
      return res.json({ clones: [] })
    }

    const { data: clones, error } = await supabase
      .from('clones')
      .select('id, name, persona_description')
      .in('id', cloneIds)

    if (error) throw error

    res.json({ clones })
  } catch (error) {
    console.error('Clone list error:', error)
    res.status(500).json({ error: 'Failed to fetch clones' })
  }
})

/**
 * PUT /clones/update-session
 * Update active clones in a session
 */
router.put('/update-session', async (req: AuthRequest, res: Response) => {
  try {
    const { session_id, clone_ids } = req.body
    const userId = req.userId!

    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', session_id)
      .eq('user_id', userId)
      .single()

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    const { data: updated, error } = await supabase
      .from('chat_sessions')
      .update({ active_clones: clone_ids })
      .eq('id', session_id)
      .select()
      .single()

    if (error) throw error

    res.json(updated)
  } catch (error) {
    console.error('Update session error:', error)
    res.status(500).json({ error: 'Failed to update session' })
  }
})

export default router
```

**Step 2: Integrate clone routes**

In `backend/src/index.ts`:
```typescript
import cloneRoutes from './routes/clones'

app.use('/clones', requireAuth, cloneRoutes)
```

**Step 3: Seed sample clones**

Create `docs/seed-clones.sql`:
```sql
INSERT INTO clones (name, persona_description, system_prompt, category, tags) VALUES
('Game Developer', 'Indie game developer, 5+ years experience', 'You are an indie game developer with 5+ years of experience. You are critical of game design and marketing.', 'Game Dev', '["indie", "game"]'),
('SaaS Founder', 'Early-stage B2B SaaS founder', 'You are an early-stage SaaS founder focused on finding product-market fit. You are pragmatic and data-driven.', 'Founder', '["saas", "b2b"]'),
('Marketing Manager', 'B2B marketing manager at mid-size company', 'You are a B2B marketing manager concerned with lead generation and ROI. You are skeptical of hype.', 'Marketing', '["b2b", "marketing"]');
```

**Step 4: Commit**

```bash
git add backend/src/routes/clones.ts backend/src/index.ts docs/seed-clones.sql
git commit -m "feat: add clone search and session update routes"
```

---

## Phase 4: Frontend Pages & Navigation

### Task 9: Set Up Frontend Routing & Layouts

**Files:**
- Create: `frontend/src/pages/Home.tsx`
- Create: `frontend/src/pages/About.tsx`
- Create: `frontend/src/pages/Docs.tsx`
- Create: `frontend/src/pages/Waitlist.tsx`
- Create: `frontend/src/pages/Chat.tsx`
- Create: `frontend/src/components/Navigation.tsx`
- Modify: `frontend/src/App.tsx`

**Step 1: Create Navigation component**

```typescript
// frontend/src/components/Navigation.tsx
import { useState } from 'react'

export function Navigation() {
  const [isAuth, setIsAuth] = useState(false)

  return (
    <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid #ccc' }}>
      <a href="/">Capybara</a>
      <a href="/about">About</a>
      <a href="/docs">Docs</a>
      {!isAuth && <a href="/waitlist">Join Waitlist</a>}
      {isAuth && <a href="/chat">Chat</a>}
    </nav>
  )
}
```

**Step 2: Create Home page**

```typescript
// frontend/src/pages/Home.tsx
export function Home() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <h1>Talk to 10 Digital Clones. Get Honest Feedback in Minutes.</h1>
      <p>Instant, actionable user research — not aggregated summaries.</p>
      <div>
        <h2>Why Capybara?</h2>
        <ul>
          <li><strong>Speed:</strong> Get feedback in minutes, not weeks</li>
          <li><strong>Depth:</strong> Real user perspectives, not patterns</li>
          <li><strong>Actionability:</strong> Catch what will actually fail</li>
          <li><strong>AI-Native:</strong> Fully powered by advanced AI</li>
        </ul>
      </div>
      <button style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
        <a href="/waitlist">Join the Waitlist</a>
      </button>
    </div>
  )
}
```

**Step 3: Create About page**

```typescript
// frontend/src/pages/About.tsx
export function About() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <h1>About Capybara</h1>
      <p>
        Capybara is built for early-stage founders and marketers who need honest, immediate feedback on their
        product positioning, sales pitches, and marketing messages.
      </p>
      <p>
        Instead of waiting weeks for user interviews or surveys, you get AI-powered digital clones trained on real
        personas who can give you nuanced, individual perspectives in minutes.
      </p>
      <h2>The Problem</h2>
      <p>
        Existing research tools like Deep Research aggregate patterns across hundreds of sources, but miss the
        individual signals that matter most. They're also slow and keyword-based.
      </p>
      <h2>Our Solution</h2>
      <p>
        Digital clones trained on real user data. Each clone understands implicit user needs, not just surface-level
        keywords. You get instant feedback designed for action.
      </p>
    </div>
  )
}
```

**Step 4: Create Docs page**

```typescript
// frontend/src/pages/Docs.tsx
export function Docs() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <h1>Getting Started with Capybara</h1>
      <h2>1. Join the Waitlist</h2>
      <p>Click "Join Waitlist" to sign up with Google. We'll review your request and grant access shortly.</p>
      <h2>2. Enter God Mode</h2>
      <p>
        Once approved, log in and describe your research goal. Example: "Test my sales pitch on early-stage SaaS
        founders."
      </p>
      <p>Capybara AI will suggest relevant digital clones to chat with.</p>
      <h2>3. Enter Conversation Mode</h2>
      <p>Select your clones and ask them questions. Each clone responds with their individual perspective.</p>
      <h2>4. Get Insights</h2>
      <p>Review responses to identify patterns and gaps in your pitch or product positioning.</p>
      <h2>Pro Tips</h2>
      <ul>
        <li>Be specific in your questions</li>
        <li>Ask follow-ups to dig deeper</li>
        <li>Use @mentions to target specific clones</li>
        <li>Switch back to God Mode for guidance anytime</li>
      </ul>
    </div>
  )
}
```

**Step 5: Create Waitlist page (minimal)**

```typescript
// frontend/src/pages/Waitlist.tsx
export function Waitlist() {
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <h1>Join the Waitlist</h1>
      <p>Sign in with Google to join our waitlist. We'll notify you when you're approved for access.</p>
      <button style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
        Sign in with Google
      </button>
    </div>
  )
}
```

**Step 6: Create Chat page (placeholder)**

```typescript
// frontend/src/pages/Chat.tsx
export function Chat() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <h1>Chat Product</h1>
      <p>[Chat UI will be implemented in next phase]</p>
    </div>
  )
}
```

**Step 7: Update App.tsx with routing**

```typescript
// frontend/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navigation } from './components/Navigation'
import { Home } from './pages/Home'
import { About } from './pages/About'
import { Docs } from './pages/Docs'
import { Waitlist } from './pages/Waitlist'
import { Chat } from './pages/Chat'

function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/waitlist" element={<Waitlist />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

**Step 8: Install react-router**

```bash
npm install react-router-dom --workspace=frontend
```

**Step 9: Test pages load**

```bash
npm run dev --workspace=frontend
# Navigate to http://localhost:3000 and test each page
```

**Step 10: Commit**

```bash
git add frontend/src/pages/ frontend/src/components/Navigation.tsx frontend/src/App.tsx
git commit -m "feat: add navigation and basic pages (home, about, docs, waitlist, chat)"
```

---

### Task 10: Implement Google Auth on Waitlist Page

**Files:**
- Modify: `frontend/src/pages/Waitlist.tsx`
- Create: `frontend/src/services/auth.ts`
- Modify: `frontend/src/App.tsx`

**Step 1: Create auth service**

```typescript
// frontend/src/services/auth.ts
import { useGoogleLogin } from '@react-oauth/google'

export function useGoogleAuth() {
  const login = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        // Send credential to backend
        const response = await fetch('http://localhost:3001/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: codeResponse.credential }),
        })

        const data = await response.json()

        if (data.user_id) {
          // Save session
          localStorage.setItem('user_id', data.user_id)
          localStorage.setItem('session_token', data.session_token)

          if (data.approved) {
            window.location.href = '/chat'
          } else {
            alert('Your request is pending approval. We will notify you when you have access.')
          }
        }
      } catch (error) {
        console.error('Auth failed:', error)
        alert('Authentication failed')
      }
    },
  })

  return login
}

export function getAuthHeaders() {
  const userId = localStorage.getItem('user_id')
  return userId ? { 'x-user-id': userId } : {}
}
```

**Step 2: Update Waitlist page**

```typescript
// frontend/src/pages/Waitlist.tsx
import { useGoogleAuth } from '../services/auth'

export function Waitlist() {
  const login = useGoogleAuth()

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <h1>Join the Waitlist</h1>
      <p>Sign in with Google to join our waitlist. We'll notify you when you're approved for access.</p>
      <button
        style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
        onClick={() => login()}
      >
        Sign in with Google
      </button>
    </div>
  )
}
```

**Step 3: Install Google OAuth library**

```bash
npm install @react-oauth/google --workspace=frontend
```

**Step 4: Wrap app with GoogleOAuthProvider**

In `frontend/src/main.tsx`:
```typescript
import { GoogleOAuthProvider } from '@react-oauth/google'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

ReactDOM.createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
)
```

Add to `.env`:
```
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

**Step 5: Test Google auth**

```bash
npm run dev --workspace=frontend
# Click "Join Waitlist", sign in with Google
# Should create user and redirect (waiting for approval message)
```

**Step 6: Commit**

```bash
git add frontend/src/pages/Waitlist.tsx frontend/src/services/auth.ts frontend/src/main.tsx .env
git commit -m "feat: add google oauth authentication to waitlist"
```

---

## Phase 5: Frontend Chat UI

### Task 11: Build Chat Message Component

**Files:**
- Create: `frontend/src/components/ChatMessage.tsx`
- Create: `frontend/src/components/ChatInput.tsx`

**Step 1: Create message component**

```typescript
// frontend/src/components/ChatMessage.tsx
import React from 'react'

interface ChatMessageProps {
  role: 'user' | 'capybara' | 'clone'
  sender_id: string
  content: string
}

export function ChatMessage({ role, sender_id, content }: ChatMessageProps) {
  const isUser = role === 'user'
  const isSender = role === 'capybara' ? sender_id === 'capybara-ai' : true

  const styles = {
    container: {
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '1rem',
    },
    bubble: {
      maxWidth: '70%',
      padding: '0.75rem 1rem',
      borderRadius: '0.5rem',
      backgroundColor: isUser ? '#007bff' : '#f0f0f0',
      color: isUser ? '#fff' : '#000',
      wordWrap: 'break-word' as const,
    },
    header: {
      fontSize: '0.85rem',
      color: '#666',
      marginBottom: '0.25rem',
    },
  }

  return (
    <div style={styles.container}>
      <div>
        <div style={styles.header}>
          {role === 'user' && 'You'}
          {role === 'capybara' && 'Capybara AI'}
          {role === 'clone' && sender_id}
        </div>
        <div style={styles.bubble}>{content}</div>
      </div>
    </div>
  )
}
```

**Step 2: Create input component**

```typescript
// frontend/src/components/ChatInput.tsx
import React, { useState } from 'react'

interface ChatInputProps {
  onSend: (message: string, targetClones?: string[]) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (input.trim()) {
      // Parse @mentions
      const mentions = (input.match(/@\w+/g) || []).map((m) => m.slice(1))
      onSend(input, mentions.length > 0 ? mentions : undefined)
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem', borderTop: '1px solid #ccc' }}>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message... (use @mention for specific clones)"
        disabled={disabled}
        style={{
          flex: 1,
          padding: '0.75rem',
          borderRadius: '0.25rem',
          border: '1px solid #ccc',
          fontFamily: 'inherit',
        }}
        rows={2}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '0.25rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        Send
      </button>
    </div>
  )
}
```

**Step 3: Test message rendering**

Create a test page to verify components work in isolation.

**Step 4: Commit**

```bash
git add frontend/src/components/ChatMessage.tsx frontend/src/components/ChatInput.tsx
git commit -m "feat: add chat message and input components"
```

---

### Task 12: Build Main Chat UI (God Mode + Conversation Mode)

**Files:**
- Modify: `frontend/src/pages/Chat.tsx`
- Create: `frontend/src/components/GodMode.tsx`
- Create: `frontend/src/components/ConversationMode.tsx`

**Step 1: Create God Mode component**

```typescript
// frontend/src/components/GodMode.tsx
import { useState, useEffect } from 'react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'

interface GodModeProps {
  sessionId: string
  onEnterConversation: (clones: string[]) => void
}

export function GodMode({ sessionId, onEnterConversation }: GodModeProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleSendMessage = async (content: string) => {
    setLoading(true)

    try {
      const response = await fetch('http://localhost:3001/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('user_id') || '',
        },
        body: JSON.stringify({ session_id: sessionId, content }),
      })

      const data = await response.json()

      // Add messages to history
      if (data.user_message) {
        setMessages((prev) => [...prev, data.user_message])
      }

      if (data.ai_responses) {
        setMessages((prev) => [...prev, ...data.ai_responses])
      }

      // TODO: Parse Capybara response to detect clone selection
    } catch (error) {
      console.error('Message error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        <div style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>
          💡 God Mode: Talk to Capybara AI to plan your research
        </div>
        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} sender_id={msg.sender_id} content={msg.content} />
        ))}
      </div>
      <ChatInput onSend={handleSendMessage} disabled={loading} />
    </div>
  )
}
```

**Step 2: Create Conversation Mode component**

```typescript
// frontend/src/components/ConversationMode.tsx
import { useState, useEffect } from 'react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'

interface ConversationModeProps {
  sessionId: string
  activeClones: any[]
}

export function ConversationMode({ sessionId, activeClones }: ConversationModeProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleSendMessage = async (content: string, targetClones?: string[]) => {
    setLoading(true)

    try {
      const response = await fetch('http://localhost:3001/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('user_id') || '',
        },
        body: JSON.stringify({
          session_id: sessionId,
          content,
          target_clones: targetClones,
        }),
      })

      const data = await response.json()

      // Add messages
      if (data.user_message) {
        setMessages((prev) => [...prev, data.user_message])
      }

      if (data.ai_responses) {
        setMessages((prev) => [...prev, ...data.ai_responses])
      }
    } catch (error) {
      console.error('Message error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '0.5rem 1rem', backgroundColor: '#f9f9f9', borderBottom: '1px solid #ddd' }}>
        <small>Chatting with {activeClones.length} clones</small>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} sender_id={msg.sender_id} content={msg.content} />
        ))}
      </div>
      <ChatInput onSend={handleSendMessage} disabled={loading} />
    </div>
  )
}
```

**Step 3: Update Chat page**

```typescript
// frontend/src/pages/Chat.tsx
import { useState, useEffect } from 'react'
import { GodMode } from '../components/GodMode'
import { ConversationMode } from '../components/ConversationMode'

export function Chat() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [mode, setMode] = useState<'god' | 'conversation'>('god')
  const [activeClones, setActiveClones] = useState<any[]>([])

  useEffect(() => {
    // Initialize chat session on component mount
    initializeSession()
  }, [])

  const initializeSession = async () => {
    try {
      const response = await fetch('http://localhost:3001/chat/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('user_id') || '',
        },
        body: JSON.stringify({ mode: 'god' }),
      })

      const session = await response.json()
      setSessionId(session.id)
    } catch (error) {
      console.error('Session init error:', error)
    }
  }

  if (!sessionId) {
    return <div>Loading...</div>
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0.5rem 1rem', backgroundColor: '#f0f0f0', display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => setMode('god')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: mode === 'god' ? '#007bff' : '#ddd',
            color: mode === 'god' ? '#fff' : '#000',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer',
          }}
        >
          God Mode
        </button>
        <button
          onClick={() => setMode('conversation')}
          disabled={activeClones.length === 0}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: mode === 'conversation' ? '#007bff' : '#ddd',
            color: mode === 'conversation' ? '#fff' : '#000',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: activeClones.length === 0 ? 'not-allowed' : 'pointer',
            opacity: activeClones.length === 0 ? 0.5 : 1,
          }}
        >
          Conversation Mode ({activeClones.length} clones)
        </button>
      </div>

      {mode === 'god' && (
        <GodMode
          sessionId={sessionId}
          onEnterConversation={(clones) => {
            setActiveClones(clones)
            setMode('conversation')
          }}
        />
      )}

      {mode === 'conversation' && <ConversationMode sessionId={sessionId} activeClones={activeClones} />}
    </div>
  )
}
```

**Step 4: Test chat UI**

```bash
npm run dev
# Navigate to /chat (might need to approve user in database first)
# Test sending messages
```

**Step 5: Commit**

```bash
git add frontend/src/pages/Chat.tsx frontend/src/components/GodMode.tsx frontend/src/components/ConversationMode.tsx
git commit -m "feat: build god mode and conversation mode chat UI"
```

---

## Phase 6: Polish & End-to-End Testing

### Task 13: Add Protected Route & Auth Check

**Files:**
- Create: `frontend/src/components/ProtectedRoute.tsx`
- Modify: `frontend/src/App.tsx`

**Step 1: Create protected route**

```typescript
// frontend/src/components/ProtectedRoute.tsx
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
  component: React.ReactNode
}

export function ProtectedRoute({ component }: ProtectedRouteProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    const userId = localStorage.getItem('user_id')

    if (!userId) {
      setIsAuthorized(false)
      return
    }

    // Check approval status
    fetch('http://localhost:3001/user/profile', {
      headers: { 'x-user-id': userId },
    })
      .then((res) => res.json())
      .then((user) => {
        setIsAuthorized(user.approved)
      })
      .catch(() => setIsAuthorized(false))
  }, [])

  if (isAuthorized === null) return <div>Loading...</div>
  if (!isAuthorized) return <Navigate to="/waitlist" />

  return component
}
```

**Step 2: Wrap chat route**

In `frontend/src/App.tsx`:
```typescript
<Route path="/chat" element={<ProtectedRoute component={<Chat />} />} />
```

**Step 3: Commit**

```bash
git add frontend/src/components/ProtectedRoute.tsx frontend/src/App.tsx
git commit -m "feat: add protected route for chat page"
```

---

### Task 14: Add Error Handling & User Feedback

**Files:**
- Modify: `frontend/src/components/GodMode.tsx`
- Modify: `frontend/src/components/ConversationMode.tsx`

**Step 1: Add error state to God Mode**

```typescript
// In GodMode component:
const [error, setError] = useState<string | null>(null)

const handleSendMessage = async (content: string) => {
  setError(null)
  setLoading(true)

  try {
    // ... existing code
  } catch (error: any) {
    setError(error.message || 'Failed to send message')
  } finally {
    setLoading(false)
  }
}

// In JSX:
{error && <div style={{ color: 'red', padding: '0.5rem' }}>Error: {error}</div>}
```

**Step 2: Do same for Conversation Mode**

Apply same error handling pattern.

**Step 3: Test error cases**

- Send message with invalid session
- Send message without auth header
- Network timeout

**Step 4: Commit**

```bash
git add frontend/src/components/GodMode.tsx frontend/src/components/ConversationMode.tsx
git commit -m "feat: add error handling and user feedback"
```

---

### Task 15: End-to-End Testing Checklist

**Manual testing (no code changes needed):**

1. ✅ Landing page loads
2. ✅ About page loads
3. ✅ Docs page loads
4. ✅ Click "Join Waitlist" → Google auth flow
5. ✅ User created in Supabase with `approved: false`
6. ✅ Try accessing /chat → redirects to waitlist (not approved)
7. ✅ Manually set `approved: true` in Supabase
8. ✅ Log out and back in → can access /chat
9. ✅ In God Mode, send message → Capybara AI responds
10. ✅ Switch to Conversation Mode (if clones loaded) → message goes to clones
11. ✅ Test @mention functionality

**Step 1: Checklist document**

Create `docs/E2E_TEST.md` with above checklist.

**Step 2: Run full system**

```bash
npm run dev  # Start both frontend + backend
# Run through checklist
```

**Step 3: Document any issues**

If tests fail, log issues and fix them (not in this task list).

**Step 4: Commit**

```bash
git add docs/E2E_TEST.md
git commit -m "docs: add e2e testing checklist"
```

---

## Summary

**Total tasks: 15**

**Phases:**
- Phase 1 (Tasks 1-2): Database setup
- Phase 2 (Tasks 3-4): Backend auth
- Phase 3 (Tasks 5-8): Backend chat & orchestration
- Phase 4 (Tasks 9-10): Frontend pages & auth
- Phase 5 (Tasks 11-12): Frontend chat UI
- Phase 6 (Tasks 13-15): Polish & testing

**Key decisions made:**
- Thin session memory (conversation history only)
- Capybara AI drives all routing logic (no hardcoded intelligence)
- Obfuscated clone names (User_XXXX format)
- Parallel clone calls for speed
- Simple text-focused UI (minimal emoji, responsive)

**Next steps after implementation:**
- Refine Capybara AI prompts for better clone suggestions
- Add analytics
- Deploy to production
- Gather user feedback

---

## Execution Options

**Plan complete and saved to `docs/plans/2026-03-06-copybar-mvp-implementation.md`.**

Two execution options:

**Option 1: Subagent-Driven (this session)**
- I dispatch a fresh subagent per task
- Review implementation between tasks
- Fast iteration, continuous feedback

**Option 2: Parallel Session (separate)**
- Open a new session with `superpowers:executing-plans`
- Batch execution with checkpoints
- Good if you want independence

**Which approach do you prefer?**