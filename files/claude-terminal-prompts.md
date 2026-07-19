# Claude Terminal Prompts for AI Chat Application

## How to Use These Prompts

Copy-paste each prompt directly into Claude Terminal (or use with `claude < prompt.txt`). Adjust paths and specific details based on your environment.

---

## Phase 1: Project Setup & Scaffolding

### 1.1 Initialize Full-Stack Project Structure

```
Create a complete project directory structure for a full-stack AI chat application with:
- React frontend (Vite + TypeScript)
- NestJS backend
- MongoDB integration
- WebSocket support

Generate:
1. Directory tree with all folders
2. Initial package.json for both frontend and backend
3. .env.example files for both
4. Docker-compose.dev.yml for local development
5. Basic tsconfig.json for shared types

Include paths for:
- Frontend: src/components, stores, services, pages, types
- Backend: src/chat, auth, mcp, gateway, database, config
- Shared: types folder for shared interfaces

Output as organized file structure with example content for key files.
```

### 1.2 Generate Initial NestJS Project

```
Generate a production-ready NestJS project scaffold with:

1. Complete app.module.ts with imports for:
   - ConfigModule (environment variables)
   - MongooseModule (MongoDB)
   - JwtModule (authentication)
   - PassportModule (auth strategy)

2. Main.ts file with:
   - CORS configuration
   - Global error handling
   - Logging setup
   - Graceful shutdown

3. .env.example with all required variables

4. Dockerfile with:
   - Multi-stage build
   - Security best practices
   - Health check endpoint

5. package.json with all dependencies:
   - @nestjs/common, core, platform-express
   - @nestjs/websockets, @nestjs/jwt
   - @nestjs/mongoose, mongoose
   - @nestjs/config, @nestjs/passport
   - axios, socket.io
   - Development: @nestjs/cli, ts-node, jest

Ensure production-ready with proper error handling and logging.
```

### 1.3 Generate React Vite Project Template

```
Generate a production-ready React + TypeScript + Vite project with:

1. vite.config.ts with:
   - React plugin
   - Environment variable support
   - Build optimizations
   - Proxy configuration for API calls

2. tsconfig.json with:
   - Strict mode enabled
   - Path aliases for imports
   - Module resolution

3. App.tsx with router setup
   - React Router v6 integration
   - Protected routes with auth guard

4. package.json with:
   - react, react-dom, react-router-dom
   - zustand (state management)
   - axios (HTTP client)
   - TypeScript and dev tools

5. .env.example with:
   - VITE_API_URL
   - VITE_WS_URL
   - VITE_AUTH_REDIRECT_URI

6. index.css with CSS variables for:
   - Colors (surface, text, border, accent)
   - Typography (fonts, sizes)
   - Spacing (padding, margins, gaps)
   - Border radius, shadows

Include dark mode support with prefers-color-scheme media query.
```

### 1.4 Docker Compose Development Environment

```
Generate a docker-compose.dev.yml file with:

Services:
1. MongoDB:
   - Image: mongo:7.0
   - Port: 27017
   - Health check
   - Data persistence volume
   - Authentication setup

2. Backend (NestJS):
   - Build from ./backend/Dockerfile.dev
   - Port: 3001
   - Environment variables loaded from .env
   - Hot reload with volume mounts
   - Depends on MongoDB with health check
   - Command: npm run start:dev

3. Frontend (React):
   - Build from ./frontend/Dockerfile.dev
   - Port: 3000
   - Environment variables
   - Hot reload with volume mounts
   - Depends on backend

4. Redis (optional):
   - Image: redis:7-alpine
   - Port: 6379
   - For caching and sessions

Include:
- Network configuration
- Volume management
- Proper dependency ordering
- Health checks for each service
- Proper logging setup

Add comments explaining each section.
```

---

## Phase 2: Frontend Development

### 2.1 Zustand Store Implementation

```
Create a complete Zustand store for chat management with:

Features:
1. Chat Sessions:
   - sessions: ChatSession[]
   - currentSessionId: string | null
   - createSession(title: string): ChatSession
   - deleteSession(id: string): void
   - setCurrentSession(id: string): void
   - fetchSessions(): Promise<void>

2. Messages:
   - addMessage(sessionId, message): void
   - updateMessage(sessionId, messageId, content): void
   - appendToMessage(sessionId, messageId, chunk): void (for streaming)
   - startStreaming(sessionId, messageId): void
   - stopStreaming(sessionId, messageId): void

3. State:
   - isLoading: boolean
   - selectedModel: string
   - getCurrentSession(): ChatSession | null

4. Persistence:
   - Persist to localStorage with zustand/middleware
   - Only persist sessions and selectedModel
   - Exclude real-time streaming state

5. TypeScript:
   - Strict types for all interfaces
   - Message and ChatSession types
   - Export all types

Include comprehensive JSDoc comments for each function.
Also include example usage patterns.
```

### 2.2 WebSocket Manager Service

```
Create a production-grade WebSocket manager with:

Class: WebSocketManager

Features:
1. Connection Management:
   - connect(token: string): Promise<void>
   - disconnect(): void
   - isConnected(): boolean
   - Auto-reconnect with exponential backoff (max 5 attempts)

2. Message Handling:
   - send(type: string, payload: any): void
   - on(type: string, handler: MessageHandler): () => void (unsubscribe function)
   - Message queue for offline messages
   - Flush queue when reconnected

3. Error Handling:
   - Comprehensive error logging
   - Graceful fallback for connection failures
   - Retry strategy with exponential backoff

4. React Hook:
   - useWebSocket() hook for component integration
   - Auto-connect on mount
   - Cleanup on unmount

5. Type Safety:
   - TypeScript interfaces for all message types
   - Message handler typing
   - Socket state typing

Include:
- Detailed comments explaining reconnection logic
- Example event subscriptions
- Memory leak prevention
- Proper cleanup

Export both class and hook for flexibility.
```

### 2.3 Streaming Message Component

```
Create a React component for streaming messages with:

Props:
- id: string (message ID)
- role: 'user' | 'assistant'
- content: string (initial content)
- isStreaming: boolean
- timestamp: Date

Features:
1. Display:
   - Animated cursor when streaming
   - Timestamp formatting (HH:mm)
   - Avatar/indicator for role
   - Proper markdown rendering (code blocks, bold, etc.)

2. Streaming:
   - Listen to custom events: `stream:${messageId}`
   - Update content in real-time without re-rendering parent
   - Auto-scroll to latest message
   - Stop animation when streaming complete

3. Styling:
   - Message bubble design (user on right, assistant on left)
   - Different backgrounds for user/assistant
   - Proper spacing and padding
   - Responsive on mobile

4. Accessibility:
   - Semantic HTML
   - ARIA labels
   - Keyboard navigation support

5. Animation:
   - Fade-in animation for new messages
   - Cursor blinking animation
   - Smooth color transitions

Include:
- CSS-in-JS or CSS module imports
- Example props usage
- Type definitions
```

### 2.4 Chat Input Component with Send Handler

```
Create a MessageInput component with:

Features:
1. Input Area:
   - Textarea (auto-grow height)
   - Keyboard shortcut: Ctrl+Enter to send
   - Character count display
   - Max length validation

2. Send Handler:
   - Prevent empty messages
   - Show loading state during send
   - Clear input after send
   - Disable button while loading

3. Message Flow:
   - Create user message object with ID
   - Add to store immediately (optimistic update)
   - Create assistant message placeholder
   - Start streaming
   - Send via WebSocket

4. Streaming Integration:
   - Subscribe to STREAM_CHUNK events
   - Dispatch custom events to streaming component
   - Append chunks to message in store
   - Handle errors gracefully

5. Error Handling:
   - Display error toast/notification
   - Cancel streaming on error
   - Restore UI state
   - Log errors

Include:
- TypeScript types
- Error boundary wrapper
- Loading spinner during send
- Disabled state styling
```

### 2.5 Sidebar Component

```
Create a Sidebar component with:

Sections:
1. Header:
   - "New Chat" button
   - Prominent styling with accent color
   - On click: create new session

2. Sessions List:
   - Scrollable container
   - Session items showing:
     - Session title (truncated if long)
     - Last message timestamp
     - Delete button (on hover)
   - Click to select session
   - Active state highlighting
   - Sort by updatedAt descending

3. Footer:
   - Settings link → /settings
   - Logout link → /logout
   - User profile button (optional)

Features:
1. Real-time Updates:
   - Watch chatStore for session changes
   - Auto-refresh on delete
   - Update active state

2. Interaction:
   - Confirm delete dialog
   - Loading states
   - Hover effects

3. Styling:
   - Dark/light mode support
   - Proper spacing and sizing
   - Responsive collapse on mobile
   - Smooth transitions

4. Performance:
   - Memoize session items
   - Virtual scrolling for many sessions
   - Avoid unnecessary re-renders

Include:
- Session context menu (archive, delete, rename)
- Search/filter sessions
- Empty state message
```

### 2.6 Main Chat Page Layout

```
Create the main Chat page component with:

Layout:
- Flexbox layout with sidebar + chat area
- Full height container (100vh)
- Proper spacing and borders

Features:
1. Initialization:
   - Check if user is authenticated (token in localStorage)
   - Redirect to login if not
   - Fetch sessions on mount

2. Session Management:
   - Create default session if none exist
   - Set current session
   - Watch for session changes

3. Responsive Design:
   - Sidebar collapse on mobile
   - Full-width chat on mobile
   - Hamburger menu toggle
   - Touch-friendly buttons

4. State Management:
   - Connect to chatStore
   - Watch currentSessionId
   - Handle loading states

5. Error Handling:
   - Display error messages
   - Retry failed operations
   - Graceful fallbacks

Include:
- Proper error boundaries
- Loading indicators
- Empty state message
- Accessibility features
```

---

## Phase 3: Backend Development

### 3.1 Chat Gateway (WebSocket)

```
Create a production-grade WebSocket gateway with:

Setup:
- @WebSocketGateway decorator with CORS configuration
- Transports: websocket, polling
- Proper logging

Core Methods:
1. handleConnection(client: Socket):
   - Log connection
   - Initialize client properties

2. handleDisconnect(client: Socket):
   - Clean up user socket mapping
   - Log disconnection

3. @SubscribeMessage('AUTH'):
   - Verify JWT token
   - Extract userId from token
   - Track user sockets for multi-tab support
   - Emit AUTH_SUCCESS or AUTH_FAILED

4. @SubscribeMessage('SEND_MESSAGE'):
   - Verify authentication
   - Extract userId and sessionId
   - Save user message to DB
   - Emit acknowledgment
   - Stream Claude response
   - Handle errors

5. @SubscribeMessage('CREATE_SESSION'):
   - Verify authentication
   - Create new session
   - Return session data

6. @SubscribeMessage('GET_SESSIONS'):
   - Verify authentication
   - Fetch user's sessions
   - Emit sessions list

7. @SubscribeMessage('DELETE_SESSION'):
   - Verify authentication
   - Validate ownership
   - Delete session and messages
   - Emit confirmation

Features:
- Error handling for all operations
- Proper async/await usage
- Rate limiting checks
- Message validation
- Logging at key points

Include:
- TypeScript interfaces for payloads
- Comprehensive error messages
- JSDoc comments for each handler
```

### 3.2 Chat Service (CRUD Operations)

```
Create ChatService with:

Injections:
- @InjectModel('ChatSession') sessionModel
- @InjectModel('Message') messageModel

Methods:
1. createSession(userId, title):
   - Create session document
   - Set timestamps
   - Return session

2. saveMessage(dto):
   - Create message document
   - Update session's updatedAt
   - Increment messageCount
   - Return message

3. getSessionContext(sessionId):
   - Fetch session by ID
   - Fetch all messages sorted by timestamp
   - Return { sessionId, title, messages }
   - Format for Claude API (role, content only)

4. getSessions(userId):
   - Find user's sessions
   - Sort by updatedAt descending
   - Limit to 50
   - Use lean() for performance

5. getSession(sessionId, userId):
   - Verify ownership
   - Fetch session with all messages
   - Return full session data

6. deleteSession(sessionId, userId):
   - Verify ownership
   - Delete session
   - Delete all related messages
   - Return success

7. updateSession(sessionId, updates):
   - Update session fields
   - Update timestamp
   - Return updated session

Features:
- Error handling with meaningful messages
- Authorization checks (userId validation)
- Performance optimization (lean, indexes)
- Transaction support where needed
- Logging for audit trail

Include:
- Type definitions for all parameters
- JSDoc documentation
- Error scenarios and handling
```

### 3.3 MCP Service (Claude Integration)

```
Create MCPService for Claude API integration:

Setup:
- CLAUDE_API_KEY from environment
- API endpoint: https://api.anthropic.com/v1/messages
- Model: claude-opus-4-1 (configurable)

Core Method: streamClaude(userMessage, context)
- Async generator function
- Yields: string (each chunk)

Implementation:
1. Build messages array from context:
   - Add previous messages (role, content)
   - Add current user message
   
2. Call Claude API with:
   - model: claude-opus-4-1
   - max_tokens: 2048
   - stream: true
   - system: buildSystemPrompt(context)
   - messages array

3. Handle streaming response:
   - Process data: [DONE] events
   - Parse JSON stream events
   - Yield text content from content_block_delta
   - Handle errors gracefully

4. buildSystemPrompt(context):
   - Include session title
   - Include message count for context
   - Add guidelines for responses
   - Keep prompt concise

Features:
- Error handling with retry logic
- Exponential backoff for rate limits
- Request/response logging
- Token counting estimation
- Support for future tool calling

Tool Calling Setup (for future):
- callTool(toolName, toolInput)
- Switch statement for tool implementations
- Database query tool
- Web search tool
- File system tool

Include:
- TypeScript strict types
- Comprehensive JSDoc
- Error handling examples
- Performance considerations
```

### 3.4 MongoDB Schemas

```
Create Mongoose schemas for ChatSession and Message:

ChatSession Schema:
Fields:
- userId: string (required, indexed)
- title: string (required)
- tags: string[] (optional)
- createdAt: Date (default: now)
- updatedAt: Date (default: now, indexed)
- isArchived: boolean (default: false)
- messageCount: number (default: 0)
- lastMessageTimestamp: Date (optional)

Indexes:
- { userId: 1, updatedAt: -1 } for listing sessions
- { userId: 1 } for user queries

Message Schema:
Fields:
- id: string (required, unique)
- sessionId: string (required, indexed)
- role: enum['user', 'assistant'] (required)
- content: string (required)
- timestamp: Date (default: now, indexed)
- tokens: number (optional, for usage tracking)
- model: string (optional, which model generated)
- hasAttachments: boolean (default: false)
- metadata: object:
  - streamStatus: enum['started', 'in-progress', 'completed', 'error']
  - toolsUsed: string[]
  - searchQueries: string[]

Indexes:
- { sessionId: 1, timestamp: -1 } for message queries
- { sessionId: 1 } for session lookup
- { createdAt: 1 } TTL index for auto-deletion (90 days)

Features:
- Pre-save hooks for validation
- Post-save hooks for logging
- Lean queries where appropriate
- Efficient field selection

Include:
- Type definitions for TypeScript
- Example usage
- Index creation commands
- Migration scripts if needed
```

### 3.5 Auth Service & JWT Strategy

```
Create authentication infrastructure:

AuthService:
Methods:
1. generateTokens(userId):
   - Create accessToken (expires 15m)
   - Create refreshToken (expires 7d)
   - Store refreshToken hash in DB
   - Return both tokens

2. validateToken(token):
   - Verify JWT signature
   - Throw UnauthorizedException if invalid
   - Return decoded payload

3. refreshTokens(refreshToken):
   - Validate refresh token
   - Generate new access token
   - Return new tokens

4. logout(userId):
   - Clear refresh token from DB
   - Invalidate sessions

5. validatePassword(plainPassword, hash):
   - Compare passwords using bcrypt
   - Return boolean

JwtStrategy (Passport):
- Validate JWT from Authorization header
- Extract userId from payload
- Return user object

JwtAuthGuard:
- Use Passport JwtStrategy
- Throw UnauthorizedException if not authenticated
- Attach user to request object

Setup:
- JwtModule.register with secret and expiry
- PassportModule.register with jwt strategy
- ConfigService for JWT_SECRET from env

Features:
- Secure secret management
- Token refresh flow
- Multi-tab session handling
- Rate limiting on auth endpoints
- Audit logging for auth events

Include:
- TypeScript types for JWT payload
- Example usage in controllers
- Security best practices
- Error handling
```

### 3.6 Chat Controller

```
Create REST API controller for chat operations:

Endpoints:
1. POST /api/chat/sessions
   - @UseGuards(JwtAuthGuard)
   - Body: { title: string }
   - Response: ChatSession
   - Create new session for authenticated user

2. GET /api/chat/sessions
   - @UseGuards(JwtAuthGuard)
   - Response: ChatSession[]
   - Get all user's sessions

3. GET /api/chat/sessions/:sessionId
   - @UseGuards(JwtAuthGuard)
   - Response: ChatSession with messages
   - Verify ownership before returning

4. DELETE /api/chat/sessions/:sessionId
   - @UseGuards(JwtAuthGuard)
   - Response: { message: 'Session deleted' }
   - Verify ownership before deleting

5. GET /api/chat/sessions/:sessionId/messages
   - @UseGuards(JwtAuthGuard)
   - Query: skip, limit for pagination
   - Response: Message[]
   - Paginated message retrieval

6. PUT /api/chat/sessions/:sessionId
   - @UseGuards(JwtAuthGuard)
   - Body: { title?: string, tags?: string[] }
   - Response: Updated session
   - Update session metadata

Features:
- Proper HTTP status codes
- Error handling with readable messages
- Input validation with decorators
- Pagination for large datasets
- Logging for operations
- Rate limiting

Include:
- TypeScript DTO classes
- Swagger/OpenAPI documentation
- Example request/responses
- Security headers
```

---

## Phase 4: Integration & Advanced Features

### 4.1 Message Streaming Pipeline

```
Create end-to-end streaming implementation:

Flow:
1. Frontend sends message via WebSocket
2. Backend receives SEND_MESSAGE
3. Gateway starts streaming to Claude
4. For each chunk from Claude:
   - Emit STREAM_CHUNK event to client
   - Client receives chunk
   - Client appends to message in store
   - Component re-renders with new text
5. Claude finishes response
6. Backend saves complete message
7. Emit MESSAGE_COMPLETE

Implementation Details:
- Message ID generation: crypto.randomUUID()
- Stream chunk emission: emit('STREAM_CHUNK', { messageId, chunk })
- Custom events for component updates
- Error recovery: if stream fails, show error

Testing:
- Send message and watch streaming
- Verify chunks arrive in order
- Check message is saved completely
- Test interruption/cancellation

Performance:
- Buffer 1-2 chunks before emit to reduce overhead
- Use requestAnimationFrame for UI updates
- Clean up event listeners on unmount
- Monitor memory for streaming state

Include:
- Code for both frontend and backend
- Error scenarios
- Stress testing approach
```

### 4.2 Local Testing Terminal Component

```
Create an in-app terminal component for testing:

Features:
1. Terminal UI:
   - Monospace font display
   - Black/green terminal theme
   - Scrollable log area
   - Clear button
   - Copy button for logs

2. Controls:
   - "Start Test" button: initiate Claude streaming
   - "Stop" button: cancel streaming
   - Log level selector (debug, info, warn, error)
   - Filter by keyword

3. Capture Backend Output:
   - Capture console.logs from backend
   - Show streaming chunks in real-time
   - Display timing/latency info
   - Show token usage

4. Display Format:
   ```
   [HH:mm:ss] [INFO] Starting test session...
   [HH:mm:ss] [DEBUG] Connected to WebSocket
   [HH:mm:ss] [INFO] Sending message to Claude
   [HH:mm:ss] [STREAM] "Hello, I'm Claude"
   [HH:mm:ss] [STREAM] " and I'm here to help"
   [HH:mm:ss] [INFO] Message complete (150 tokens)
   ```

5. Interaction Log:
   - Save all interactions to localStorage
   - Export logs as JSON
   - Timestamp for each event
   - Duration tracking

Implementation:
- Connect to WebSocket with debug mode
- Create custom event emitter for logs
- Store in memory with circular buffer (last 1000 lines)
- Real-time updates

Include:
- React component code
- CSS for terminal styling
- Example log output
- Performance considerations
```

### 4.3 Session Export/Import

```
Create session data management functionality:

Export Features:
1. Export Single Session:
   - Format: JSON
   - Include: session metadata + all messages
   - Beautified output
   - Download as .json file

2. Export All Sessions:
   - Create ZIP file with separate JSON per session
   - Metadata file with export timestamp
   - User info in metadata

3. Export Formats:
   - JSON (raw data)
   - Markdown (human readable)
   - PDF (formatted document)

Import Features:
1. Import Session:
   - File upload input
   - Validate JSON structure
   - Merge or create new sessions
   - Progress indicator for large imports

2. Conflict Resolution:
   - If session ID exists: create new with timestamp
   - Option to overwrite
   - Merge messages from both

Implementation:
- Backend import endpoint
- Data validation
- Error handling for corrupted files
- Atomic transactions

Include:
- Frontend file handling code
- Backend import logic
- Data validation schemas
- Error scenarios
```

---

## Phase 5: Testing & Quality Assurance

### 5.1 Unit Tests for Chat Service

```
Write comprehensive unit tests for ChatService:

Test Suites:
1. createSession:
   - Should create session with correct fields
   - Should set timestamps
   - Should handle database errors
   - Should validate user ownership

2. saveMessage:
   - Should save message with all fields
   - Should update session timestamp
   - Should increment messageCount
   - Should handle invalid sessionId
   - Should handle database errors

3. getSessionContext:
   - Should fetch session and messages
   - Should format for Claude API
   - Should sort messages by timestamp
   - Should handle missing session
   - Should handle empty message list

4. getSessions:
   - Should return sorted sessions
   - Should limit results to 50
   - Should only return user's sessions
   - Should handle no sessions

5. deleteSession:
   - Should verify ownership
   - Should delete session and messages
   - Should throw on unauthorized access
   - Should handle missing session

Test Structure:
- Setup mocks for models
- Use jest for testing
- Mock mongoose queries
- Test both success and error paths

Include:
- Complete test file
- Mock data generators
- Assertions for each scenario
- Performance tests
```

### 5.2 End-to-End Tests (Cypress)

```
Write E2E tests covering full chat flow:

Test Scenarios:
1. Authentication:
   - User can login with valid credentials
   - User is redirected to chat on login
   - User can logout
   - Unauthenticated users redirected to login

2. Session Management:
   - Create new session with title
   - Session appears in sidebar
   - Delete session
   - Multiple sessions maintained separately
   - Switch between sessions

3. Messaging:
   - Send message
   - Message appears in chat area
   - User message shows on right
   - Assistant response arrives
   - Streaming animation works
   - Multiple messages stacked properly

4. Real-time Features:
   - Message streams character by character
   - Cursor animates during streaming
   - Multiple tabs stay in sync
   - Disconnect/reconnect handling

5. Error Handling:
   - Error message on failed send
   - Recover from network error
   - Handle API errors gracefully
   - Show retry option

6. Performance:
   - Page loads within 3s
   - Message sends within 1s
   - Streaming starts within 500ms
   - No memory leaks on navigation

Test Commands:
```bash
npx cypress open  # Interactive mode
npx cypress run   # Headless mode
```

Include:
- Selectors for all interactive elements
- Wait/retry logic for timing
- Mock API calls where needed
- Screenshot on failure
- Video recording for debugging
```

### 5.3 Load Testing

```
Set up load testing with Artillery:

Configuration (loadtest.yml):
```yaml
config:
  target: "http://localhost:3001"
  phases:
    - duration: 60      # 1 minute warmup
      arrivalRate: 5    # 5 new users/sec
    - duration: 120     # 2 minute main test
      arrivalRate: 20   # 20 new users/sec
    - duration: 60      # 1 minute ramp down
      arrivalRate: 5

scenarios:
  - name: Chat Flow
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "{{ $randomString(10) }}@test.com"
            password: "password123"
      - think: 2
      - post:
          url: "/api/chat/sessions"
          json:
            title: "Load Test Session"
      - think: 3
      - get:
          url: "/api/chat/sessions"
```

Metrics to Track:
- Request latency (p50, p95, p99)
- Error rate
- Throughput (requests/sec)
- Memory usage
- CPU usage
- Database query performance

Run: `npx artillery run loadtest.yml`

Include:
- Baseline performance metrics
- Alerts for regressions
- Scalability recommendations
```

---

## Phase 6: Deployment & DevOps

### 6.1 Production Deployment Script

```
Create a deployment script with:

Pre-deployment:
1. Build frontend:
   - npm run build
   - Output to dist/
   - Minify and optimize
   - Generate source maps

2. Build backend:
   - npm run build
   - Typecheck: tsc --noEmit
   - Run tests: npm test
   - Generate artifacts

3. Docker builds:
   - Build backend image
   - Build frontend image
   - Tag with version
   - Run security scan

Deployment:
1. Environment setup:
   - Load .env.production
   - Verify all secrets set
   - Check database connectivity
   - Verify API keys

2. Database:
   - Run migrations
   - Verify indexes
   - Backup before update

3. Service deployment:
   - Push images to registry
   - Update Kubernetes manifests
   - Apply kubectl changes
   - Verify rollout

4. Verification:
   - Health check endpoints
   - Smoke tests
   - Verify functionality
   - Check error logs

5. Rollback:
   - Keep previous version
   - Easy rollback command
   - Data rollback procedure

Include:
- Bash script with functions
- Error handling and logging
- Dry-run mode
- Slack notifications
```

### 6.2 Monitoring & Alerting Setup

```
Configure monitoring with:

Metrics to Track:
1. Backend:
   - Request latency
   - Error rate
   - Active connections
   - Database query time
   - Memory usage
   - CPU usage

2. Frontend:
   - Page load time
   - Time to interactive
   - JavaScript errors
   - Failed API calls
   - Component render time

3. Database:
   - Query latency
   - Connection pool usage
   - Storage size
   - Slow queries
   - Replication lag

4. Business Metrics:
   - Active users
   - Messages per day
   - API tokens used
   - Cost tracking

Alert Rules:
- Error rate > 1%
- P95 latency > 2s
- Memory > 80%
- Database down
- Deployment failure

Tools:
- Prometheus for metrics
- Grafana for dashboards
- Sentry for errors
- DataDog or similar for APM

Include:
- Prometheus config
- Grafana dashboard JSON
- Alert rules
- Example dashboards
```

### 6.3 Security Hardening

```
Security checklist and implementation:

Environment:
- [ ] All secrets in environment variables
- [ ] Never commit .env or keys
- [ ] Use secrets manager (AWS Secrets Manager, HashiCorp Vault)
- [ ] Rotate secrets quarterly

API Security:
- [ ] HTTPS/TLS only in production
- [ ] CORS properly configured
- [ ] CSRF protection
- [ ] Rate limiting (100 req/min per IP)
- [ ] Input validation on all endpoints
- [ ] Output encoding
- [ ] SQL injection prevention (using ORM)

Authentication:
- [ ] JWT with secure expiration
- [ ] Refresh token rotation
- [ ] Secure password hashing (bcrypt)
- [ ] Session invalidation on logout
- [ ] Account lockout after N failed attempts
- [ ] 2FA support

Database:
- [ ] Encryption at rest
- [ ] Encrypted connections
- [ ] Database credentials in secrets manager
- [ ] Regular backups
- [ ] Access control (principle of least privilege)
- [ ] Audit logging

Frontend:
- [ ] XSS prevention (sanitize inputs)
- [ ] CSP headers
- [ ] Secure cookies (httpOnly, Secure, SameSite)
- [ ] HSTS header
- [ ] No sensitive data in localStorage
- [ ] Subresource Integrity for CDN resources

Infrastructure:
- [ ] Web Application Firewall (WAF)
- [ ] DDoS protection
- [ ] VPC/Network segmentation
- [ ] Security groups/NACLs
- [ ] SSH key management
- [ ] Firewall rules

Monitoring:
- [ ] Audit logs for all operations
- [ ] Security event monitoring
- [ ] Intrusion detection
- [ ] Regular security scans
- [ ] Vulnerability scanning
- [ ] Penetration testing

Include:
- Implementation code
- Configuration templates
- Security testing procedures
```

---

## Phase 7: Optimization & Scaling

### 7.1 Performance Optimization

```
Implement performance optimizations:

Frontend:
1. Code Splitting:
   - Lazy load routes
   - Split components bundle
   - Dynamic imports for large features

2. Asset Optimization:
   - Minify CSS/JS
   - Compress images (WebP)
   - Font optimization (system fonts preferred)
   - Gzip compression

3. Runtime Performance:
   - Memoize expensive components
   - Use React.lazy for code splitting
   - Virtualize long lists
   - Debounce search/filter
   - Pagination for messages

4. Caching:
   - Browser cache headers
   - Service Worker for offline
   - API response caching
   - LocalStorage for session data

Backend:
1. Database:
   - Proper indexing on all queries
   - Connection pooling
   - Query optimization
   - Caching layer (Redis)

2. API:
   - Response compression (gzip)
   - CDN for static assets
   - API response caching
   - Query pagination
   - Field selection (lean queries)

3. Infrastructure:
   - Load balancing
   - Auto-scaling policies
   - Resource limits
   - Horizontal scaling

Tools:
- Lighthouse for frontend audit
- Chrome DevTools performance
- New Relic/DataDog for APM
- MongoDB profiler

Include:
- Optimization techniques
- Measurement methods
- Before/after metrics
- Tools and setup
```

### 7.2 Scaling Strategy

```
Plan for scaling to support more users:

Horizontal Scaling:
1. Backend Servers:
   - Load balancer in front
   - Stateless application servers
   - Use Redis for session storage
   - Shared database

2. Database:
   - Read replicas
   - Connection pooling
   - Query optimization
   - Data sharding if needed

3. Cache Layer:
   - Redis for sessions
   - Cache frequently accessed data
   - Cache Claude responses for identical queries
   - Cache invalidation strategy

4. Message Queue:
   - Async message processing
   - Decouple components
   - Handle spikes
   - BullMQ or similar

5. CDN:
   - Serve static assets globally
   - Reduce bandwidth
   - Faster load times

Cost Optimization:
- Auto-scaling policies
- Reserved instances
- Spot instances for non-critical
- API rate limits to prevent abuse
- Monitor usage and costs

Bottleneck Analysis:
- Profile application
- Identify slow endpoints
- Database query analysis
- Network analysis
- Memory profiling

Include:
- Kubernetes manifests for scaling
- Auto-scaling policies
- Cost estimation
- Monitoring setup
```

---

## Quick Prompt Combinations

### 🚀 "Build and Deploy MVP"

```
I want to quickly build and deploy an MVP of the AI chat app.

Phase 1 (Today):
1. Frontend: React component structure with Zustand
2. Backend: NestJS with Chat service
3. Integration: WebSocket for real-time chat
4. Database: MongoDB with basic schemas

Phase 2 (Tomorrow):
1. Claude API integration with streaming
2. Deployment: Docker Compose locally
3. Testing: Basic E2E tests
4. Documentation: README and API docs

For each phase:
- Generate complete, ready-to-use code
- Include setup instructions
- Provide testing commands
- Show expected output

Focus on: speed over perfection, core features only, skip advanced optimization.
```

### 🔧 "Debug WebSocket Streaming Issue"

```
WebSocket streaming is not working properly. The messages are not appearing in real-time.

Issue Description:
- User sends message
- WebSocket connection is open (verified)
- Backend receives message (logs show it)
- Stream starts but chunks don't reach frontend
- Frontend doesn't update with streamed content

Debugging steps:
1. Check WebSocket message format
2. Verify event names match (STREAM_CHUNK vs stream_chunk)
3. Check if custom events are firing
4. Verify Zustand store updates
5. Check component re-render logic

Provide:
- Debugging checklist
- Code to inspect socket events
- Frontend code to log chunks
- Backend code to verify emission
- Common issues and fixes
```

### 🏗️ "Generate Complete Feature: User Settings"

```
Generate a complete "User Settings" feature including:

Frontend:
- Settings page component
- Form for: theme, model selection, API key, export data
- Save/cancel buttons
- Success/error notifications

Backend:
- User schema with preferences
- Settings controller endpoints
- Service methods for CRUD
- Validation and error handling

Database:
- Update User model
- Add migration if needed
- Indexes for queries

Integration:
- Connect to auth system
- Load settings on login
- Apply theme preference to app
- Handle settings updates

Testing:
- Unit tests for service
- E2E test for UI flow
- Error scenarios

Include:
- Complete code for all layers
- TypeScript types
- Error handling
- Validation rules
- CSS for settings UI
```

---

## Usage Tips

1. **Copy exact prompts** - They're designed to be comprehensive
2. **Customize context** - Add your specific file paths if needed
3. **Chain prompts together** - Use output from one as input to next
4. **Ask for variations** - "Similar to above but for Messages instead of Sessions"
5. **Request specific fixes** - "The code compiles but types are wrong, fix TypeScript errors"
6. **Ask for tests** - "Add unit tests for the code you just generated"
7. **Request documentation** - "Add JSDoc comments and usage examples"

---

## When to Use Which Prompt

| Situation | Use This Prompt |
|-----------|-----------------|
| Starting from scratch | 1.1, 1.2, 1.3, 1.4 |
| Building frontend | 2.1-2.6 |
| Building backend | 3.1-3.6 |
| Integrating Claude | 4.1, 4.2, 4.3 |
| Adding tests | 5.1, 5.2, 5.3 |
| Deploying | 6.1, 6.2, 6.3 |
| Optimizing | 7.1, 7.2 |
| Debugging issue | Use specific phase + "debug" phrase |
| Adding new feature | Use relevant phase + feature description |

---

## Pro Tips for Claude Terminal

```bash
# Save prompt to file and pipe
cat prompt.txt | claude

# Or use Claude Code for longer sessions
claude --code

# Ask Claude to generate a prompt
"Generate a detailed Claude Terminal prompt for implementing user authentication"

# Chain operations
claude < setup.txt > output.md
claude < output.md > implementation.ts

# Ask Claude to refine generated code
"Take the code you just generated and:
1. Add error handling
2. Add TypeScript types
3. Add JSDoc comments
4. Add example usage"
```

