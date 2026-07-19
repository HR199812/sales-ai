# Sales AI — Project Reference for Claude

## Project Overview

A full-stack sales AI assistant for financial professionals. Salespeople query the app in natural language; the backend orchestrates multiple data agents (client CRM, product catalog, compliance engine) and then calls the Claude CLI to generate a structured, markdown-formatted response streamed in real time.

---

## Stack

### Backend (`backend/`)
- **Spring Boot 3.1**, Java 21, Maven
- **MongoDB 7** for chat session and message persistence
- **Spring Security** (JWT, stateless) — context path `/api`
- **Reactor** (`Flux`/`SseEmitter`) for SSE streaming
- **Claude CLI** (`claude -p <prompt>`) invoked via `ProcessBuilder` — NOT the Anthropic SDK
- **Lombok** for boilerplate reduction

### Frontend (`frontend/`)
- **React 18 + TypeScript**, Vite
- **Zustand** for global state (`authStore`, `chatStore`)
- **Biome.js** for lint and format (replaces ESLint + Prettier)
- **react-markdown + remark-gfm** for rendering assistant responses as markdown
- **Axios** for REST, native `EventSource` for SSE
- Dev port: **5173** | Docker port: **3000**

---

## Running the Project

### Docker (recommended)
```bash
cp .env.example .env          # fill CLAUDE_API_KEY and JWT_SECRET
docker-compose up --build
```
Services: MongoDB on 27017, backend on 8080 (`/api`), frontend on 3000.

### Local dev
```bash
# Terminal 1 — backend
cd backend && mvn spring-boot:run

# Terminal 2 — frontend
cd frontend && npm install && npm run dev
```
Backend requires a running MongoDB on localhost:27017.

### Frontend scripts
```bash
npm run dev          # start dev server
npm run lint         # biome check
npm run lint:fix     # biome check --write (auto-fix)
npm run format       # biome format --write
```

---

## Architecture

### SSE Streaming Protocol

All AI responses are streamed via Server-Sent Events. Two endpoints produce SSE:
- `POST /api/chat/sessions/{sessionId}/message` — general chat (uses `SseEmitter`)
- `POST /api/sales/analyze` — multi-agent sales analysis (returns `Flux<String>`)

**Status token protocol**: The backend prefixes agent state transitions with `__STATUS__:` before content begins. The frontend parses these to show animated status badges.

```
__STATUS__:connecting      → "Connecting..."       (blue)
__STATUS__:agent1          → "Fetching client data..."     (violet)
__STATUS__:agent2          → "Fetching product catalog..."  (violet)
__STATUS__:agent3          → "Running compliance checks..."  (amber)
__STATUS__:thinking        → "Thinking..."         (purple)
__STATUS__:mcp_connected   → "MCP Connected"       (green)
__STATUS__:mcp_thinking    → "MCP Thinking..."     (green)
__STATUS__:calling         → "Calling agent..."    (blue)
__STATUS__:almost_done     → "Almost done thinking..." (purple)
```

Status tokens are **never** saved to MongoDB — `ChatController` filters them before persisting `fullResponse`.

The badge only shows while `agentState` is set AND the message has no content yet. Once real content streams in, `setMessageAgentState(null)` is called first, then content is appended.

### Agent Orchestration (`SalesAgentService`)

```
connecting (600ms) → agent1: fetch client → (700ms)
→ agent2: fetch product → (600ms)
→ agent3: GTT compliance check → (500ms)
→ thinking: call Claude CLI → stream response → almost_done
```

Delays are intentional — the data fetches are in-memory and instant; the sleeps give the UI time to render each badge.

### Sales Data (`SalesDataService`)

Dummy in-memory data (no external DB calls):
- **5 clients**: C001 Apex Capital (Institutional), C002 Meridian (Low risk), C003 TechVentures (High risk), C004 Global Pension (KYC Expired), C005 Sunrise Retail (NO_STRUCTURED_PRODUCTS)
- **6 products**: P001 AAPL, P002 TSLA (no Retail), P003 T-Bond, P004 EUR/USD Structured Note (Professional+ only), P005 SPY ETF, P006 Crude Oil Futures (Derivative)
- **GTT rule engine**: 6 rules — KYC_CURRENT, PRODUCT_ACTIVE, CLIENT_TYPE_ELIGIBILITY, RISK_SUITABILITY, CLIENT_RESTRICTIONS, JURISDICTION

---

## Key Files

### Backend
| File | Purpose |
|---|---|
| `service/ClaudeService.java` | Invokes `claude -p` CLI, emits connecting→thinking→content→almost_done |
| `service/SalesAgentService.java` | 4-agent orchestration with status emissions and delays |
| `service/SalesDataService.java` | In-memory client/product data + GTT rule engine |
| `controller/ChatController.java` | General chat SSE endpoint; filters status tokens before DB save |
| `controller/SalesController.java` | Sales data endpoints + `/analyze` SSE |
| `config/SecurityConfig.java` | JWT auth; `ASYNC` dispatcher type permitted (required for SseEmitter) |

### Frontend
| File | Purpose |
|---|---|
| `stores/chatStore.ts` | Sessions, messages, `setMessageAgentState`, `appendToMessage`, `stopStreaming` |
| `components/ChatArea/MessageInput.tsx` | SSE client; routes `__STATUS__:` tokens vs content; file upload (xlsx/csv/images only) |
| `components/ChatArea/StreamingMessage.tsx` | Renders message + animated agent status badge; assistant content via `react-markdown` |
| `pages/ChatPage.tsx` | Sidebar + welcome screen; `handleNewChat` sets `currentSession(null)` (shows welcome, not chat) |
| `types/index.ts` | `Message` includes `agentState?: string \| null` |

---

## Important Decisions & Gotchas

- **`DispatcherType.ASYNC` must be permitted** in `SecurityConfig` — Spring Security 6 blocks async re-dispatches by default, which causes `AccessDeniedException` on all SSE streams.
- **`handleNewChat` calls `setCurrentSession(null)`** — do NOT call `createSession()` here or the UI skips the welcome screen and goes straight to the bottom-input chat view.
- **Model pill** always shows "Model: Markets-Sales-One" in both the welcome screen input and the active chat input bar.
- **File upload** is restricted to `.xlsx,.csv,image/*` — enforced in `MessageInput.tsx` `accept` attribute.
- **Claude CLI chunk size** is 128 chars (not 32) to avoid splitting markdown tokens mid-word.
- **`almost_done` badge never shows** because `showBadge = !isUser && stateConfig && !displayContent` — by the time `almost_done` emits, content has already arrived. This is by design.
- **Biome** is the linter/formatter (not ESLint/Prettier). Biome uses tabs and double quotes by default. Running `npm run lint:fix` will reformat files to match.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `CLAUDE_API_KEY` | Yes | Used by the `claude` CLI inside the container |
| `JWT_SECRET` | Yes | Min 32 chars, for signing JWT tokens |
| `MONGODB_URI` | No | Defaults to `mongodb://localhost:27017/sales_ai_db` |
| `MONGODB_DATABASE` | No | Defaults to `sales_ai_db` |

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| POST | `/api/chat/sessions` | JWT | Create chat session |
| GET | `/api/chat/sessions` | JWT | List user's sessions |
| GET | `/api/chat/sessions/{id}` | JWT | Get session with messages |
| DELETE | `/api/chat/sessions/{id}` | JWT | Delete session |
| POST | `/api/chat/sessions/{id}/message` | JWT | Send message, SSE stream |
| GET | `/api/sales/clients` | JWT | All client data (dummy) |
| GET | `/api/sales/products` | JWT | All product data (dummy) |
| GET | `/api/sales/compliance/good-to-trade` | JWT | All GTT results |
| POST | `/api/sales/analyze` | JWT | Multi-agent sales analysis, SSE stream |
