# Claude Terminal: Practical Examples & Commands

## Quick Start: Generate Entire Feature

### Example 1: Generate Login Component (Complete)

```bash
cat << 'EOF' | claude
Generate a complete login page component for React with:

Requirements:
- Email and password inputs
- Form validation (email format, password length)
- Submit button with loading state
- Error message display
- Link to signup
- Redirect to /chat on successful login
- Store JWT token in localStorage
- Use React Router for navigation
- Use Zustand for auth state

Include:
1. React component (LoginPage.tsx)
2. TypeScript types
3. Error handling
4. CSS styling (light/dark mode support)
5. Example usage
6. Unit test example

Focus on: security best practices, UX, accessibility
EOF
```

**Usage:**
```bash
# Save output to file
cat << 'EOF' | claude > login.component.tsx
... (prompt above) ...
EOF

# Or interactive
claude --code
# Then paste prompt and edit response
```

---

### Example 2: Generate Backend Endpoint (Complete)

```bash
cat << 'EOF' | claude
Generate a complete NestJS endpoint for creating chat sessions with:

Endpoint: POST /api/chat/sessions
Method: Create new chat session for authenticated user

Requirements:
1. Controller:
   - Use JwtAuthGuard
   - Accept { title: string }
   - Validate title (1-100 chars)
   - Call ChatService

2. Service:
   - Create session in MongoDB
   - Set userId from request
   - Return created session

3. Error Handling:
   - Unauthorized (401)
   - Bad request (400)
   - Server error (500)

4. Types:
   - CreateSessionDto
   - SessionResponse

5. Documentation:
   - JSDoc comments
   - Swagger decorator
   - Example request/response

6. Tests:
   - Unit test for service
   - Unit test for controller

Include: complete, production-ready code
EOF
```

---

## Pattern: Iterative Code Refinement

### Pattern 1: Generate → Review → Refine

```bash
# Step 1: Generate initial code
echo "Generate a WebSocket message handler that:
- Receives SEND_MESSAGE event
- Validates message content
- Saves to database
- Streams response from Claude" | claude > handler.ts

# Step 2: Review and ask Claude to improve
cat handler.ts | claude << 'EOF'
Review this code and:
1. Add comprehensive error handling
2. Add TypeScript strict types
3. Add JSDoc documentation
4. Add input validation
5. Add logging statements
6. Fix any potential bugs
7. Add performance optimizations

Output the improved version.
EOF
```

### Pattern 2: Generate → Test → Refine

```bash
# Step 1: Generate code
FEATURE="message streaming functionality"
cat << 'EOF' | claude > feature.ts
Generate $FEATURE for NestJS backend
EOF

# Step 2: Generate tests
cat feature.ts | claude << 'EOF'
Generate comprehensive unit tests for this code using Jest.
Include: happy path, error cases, edge cases, performance
EOF

# Step 3: If tests fail, ask for fixes
claude << 'EOF'
The test for streaming failed because:
[error details]

Fix the implementation to pass all tests.
EOF
```

---

## Real-World Workflow Examples

### Workflow 1: Building Login Feature (Complete)

```bash
# 1. Generate frontend component
cat << 'EOF' | claude > src/pages/Login.tsx
# (Login prompt from earlier)
EOF

# 2. Generate backend endpoint
cat << 'EOF' | claude > src/auth/auth.controller.ts
# (Login endpoint prompt)
EOF

# 3. Generate auth service
cat << 'EOF' | claude > src/auth/auth.service.ts
Generate AuthService with:
- validateUser(email, password)
- generateTokens(userId)
- verifyToken(token)
- Full JWT flow

Include: error handling, security, types
EOF

# 4. Generate types/DTOs
cat << 'EOF' | claude > src/auth/dto/login.dto.ts
Generate TypeScript DTOs for login flow:
- LoginRequestDto
- LoginResponseDto  
- UserDto
- Include validation decorators
EOF

# 5. Generate tests
cat src/auth/auth.service.ts | claude << 'EOF'
Generate comprehensive Jest tests for this AuthService
EOF

# 6. Result: Complete feature is ready!
ls -la src/auth/
```

### Workflow 2: Building Message Streaming (End-to-End)

```bash
#!/bin/bash

# Frontend: Input component
cat << 'EOF' | claude > frontend/src/components/MessageInput.tsx
Generate MessageInput component that:
- Takes sessionId as prop
- Sends message via WebSocket
- Shows loading state
- Clears input on send
- Handles errors

Include Zustand store integration
EOF

# Frontend: Message display with streaming
cat << 'EOF' | claude > frontend/src/components/StreamingMessage.tsx
Generate StreamingMessage component that:
- Receives message ID
- Listens to stream events
- Updates content in real-time
- Shows cursor animation
- Handles completion

Focus on: real-time updates, performance
EOF

# Backend: WebSocket handler
cat << 'EOF' | claude > backend/src/gateway/chat.gateway.ts
Generate WebSocket gateway handler for:
- Receiving SEND_MESSAGE event
- Getting session context
- Streaming response from Claude
- Emitting chunks to client
- Saving final message

Include: error handling, logging, types
EOF

# Backend: MCP service
cat << 'EOF' | claude > backend/src/mcp/mcp.service.ts
Generate MCPService that:
- Calls Claude API with streaming
- Yields chunks as AsyncGenerator
- Handles errors
- Respects rate limits

Use axios for HTTP
EOF

# Integration test
cat << 'EOF' | claude > e2e/message-streaming.spec.ts
Generate Cypress E2E test that:
- Sends a message
- Verifies streaming animation
- Checks complete response
- Tests error scenarios

Focus on: realistic scenarios, proper waits
EOF

echo "Complete streaming feature generated!"
```

---

## Advanced Patterns

### Pattern: Generating with Context Files

```bash
# When you need to reference existing code:

# 1. Reference existing service
cat << 'EOF' | claude
I have an existing ChatService (see below).
Generate a WebSocket handler that uses it.

ChatService:
$(cat backend/src/chat/chat.service.ts)

Requirements:
- Handle SEND_MESSAGE event
- Use ChatService methods
- Stream response from Claude
EOF

# 2. Reference schema
cat << 'EOF' | claude
My MongoDB schemas are:
$(cat backend/src/chat/schemas/*.ts)

Generate a data migration script that:
- Adds a new field to ChatSession
- Backfills existing data
- Includes rollback
EOF

# 3. Reference frontend store
cat << 'EOF' | claude
My Zustand store is:
$(cat frontend/src/stores/chatStore.ts)

Generate a hook that:
- Watches for new messages
- Auto-scrolls to bottom
- Handles streaming updates

Make it use the store correctly
EOF
```

### Pattern: Generating Code with Specific Constraints

```bash
# With performance requirements
cat << 'EOF' | claude
Generate message pagination implementation with:
- Load 50 messages per page
- Show loading indicator
- Infinite scroll detection
- Virtual scrolling for performance
- P95 latency < 500ms

Focus on: rendering 1000+ messages efficiently
EOF

# With security requirements
cat << 'EOF' | claude
Generate message filtering/moderation with:
- Input sanitization (XSS prevention)
- Rate limiting (10 msg/min per user)
- Profanity detection
- Spam detection

Use: DOMPurify, simple regex patterns
Keep: minimal dependencies
EOF

# With accessibility requirements
cat << 'EOF' | claude
Generate chat UI components with:
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- High contrast mode
- Focus management

Test with: axe DevTools, NVDA
EOF
```

---

## Command Patterns

### Pattern 1: Generate and Auto-Format

```bash
# Generate and format with Prettier
cat << 'EOF' | claude | npx prettier --parser typescript > output.ts
# (your prompt)
EOF

# Generate and run through TypeScript compiler
cat << 'EOF' | claude | npx ts-node
# (your prompt)
EOF

# Generate and test immediately
cat << 'EOF' | claude > test-temp.ts
# (your prompt)
EOF
npx ts-node test-temp.ts
rm test-temp.ts
```

### Pattern 2: Generate Multiple Files

```bash
# Generate and split by filename markers
cat << 'EOF' | claude | awk '
/^\/\/ FILE: / {
  if (filename) close(filename)
  filename = $3
}
!/^\/\/ FILE: / {
  print > filename
}
' && echo "Files created:"
ls -la *.ts

# The prompt should output:
# // FILE: service.ts
# [code]
# // FILE: dto.ts
# [code]
EOF
```

### Pattern 3: Generate and Insert into Existing Files

```bash
# Generate and append to existing file
cat << 'EOF' | claude >> backend/src/chat/chat.service.ts
Generate and append the following methods to ChatService:
- archiveSession(sessionId)
- searchMessages(query)
- getSessionStats(sessionId)

Keep existing code, just add new methods
EOF

# Generate inline code snippet
echo "I need a function that sanitizes user input.
Output only the function, no explanations." | claude >> utils/sanitize.ts
```

---

## Debugging with Claude Terminal

### Debugging Pattern 1: Error Analysis

```bash
# Get error message and ask Claude
cat << 'EOF' | claude
I got this error in my WebSocket handler:

$(npm run dev 2>&1 | grep -A 5 "Error:")

What's wrong and how do I fix it?
EOF
```

### Debugging Pattern 2: Code Review & Fix

```bash
# Show code and ask for debugging
cat << 'EOF' | claude
My messages aren't streaming correctly. Here's my code:

Frontend handler:
$(cat frontend/src/components/MessageInput.tsx)

Backend handler:
$(cat backend/src/gateway/chat.gateway.ts)

MCP service:
$(cat backend/src/mcp/mcp.service.ts)

Issues:
1. Chunks don't arrive at frontend
2. UI doesn't update in real-time
3. No console errors

Debug this end-to-end. What's broken?
EOF
```

### Debugging Pattern 3: Type Errors

```bash
# Show TypeScript errors and ask for fixes
cat << 'EOF' | claude
I have TypeScript errors in my component:

Component:
$(cat frontend/src/components/ChatArea.tsx)

Errors:
$(npx tsc --noEmit 2>&1)

Fix the types.
EOF
```

---

## Real Command Examples

### Real Example 1: Generate Complete Auth Module

```bash
#!/bin/bash

# Generate auth service
echo "Generating auth service..." 
cat << 'EOF' | claude > backend/src/auth/auth.service.ts
NestJS AuthService with:
- User registration (hash password with bcrypt)
- User login (JWT token generation)
- Token refresh (rotate tokens)
- Logout (invalidate token)

Use: bcrypt, jwt, @nestjs/config
Include: error handling, logging, types
EOF

# Generate auth controller
echo "Generating auth controller..."
cat << 'EOF' | claude > backend/src/auth/auth.controller.ts
NestJS controller for:
- POST /register
- POST /login
- POST /refresh
- POST /logout

Use AuthService methods
Include: validation, error responses, docs
EOF

# Generate DTOs
echo "Generating DTOs..."
cat << 'EOF' | claude > backend/src/auth/dto/index.ts
Export DTOs:
- RegisterDto
- LoginDto
- RefreshDto
- AuthResponseDto

Use class-validator decorators
EOF

# Generate tests
echo "Generating tests..."
cat backend/src/auth/auth.service.ts | claude > backend/src/auth/auth.service.spec.ts

echo "✅ Auth module complete!"
ls -la backend/src/auth/
```

### Real Example 2: Debug and Fix Streaming Issue

```bash
#!/bin/bash

# Capture the issue
cat << 'EOF' > issue.txt
Messages aren't streaming in real-time. 
User sends message → backend logs it → Claude responds → 
but chunks don't show on frontend.

Component logs show: WebSocket connected, no STREAM_CHUNK events received.
Backend logs show: chunks being emitted correctly.

Files involved:
- frontend/src/components/MessageInput.tsx
- backend/src/gateway/chat.gateway.ts
- frontend/src/services/websocket.ts
EOF

# Ask Claude to debug
cat << 'EOF' | claude > debug-report.md
Debug this streaming issue:

$(cat issue.txt)

Relevant code:
Frontend input:
$(cat frontend/src/components/MessageInput.tsx)

Backend gateway:
$(cat backend/src/gateway/chat.gateway.ts)

WebSocket service:
$(cat frontend/src/services/websocket.ts)

Analyze:
1. Check event names match exactly
2. Check WebSocket connection state
3. Check Zustand store updates
4. Identify root cause
5. Provide fix with code
EOF

echo "Debug report generated: debug-report.md"
cat debug-report.md
```

---

## Pro Tips & Tricks

### Tip 1: Use Functions for Reusable Prompts

```bash
# Create a prompt function
generate_component() {
  local name=$1
  local description=$2
  
  cat << EOF | claude
Generate a React component named $name with:
$description

Include:
- TypeScript types
- JSDoc comments
- Example usage
- CSS styling
- Unit test example
EOF
}

# Use it
generate_component "ChatHeader" "
- Display session title
- Show user info
- Settings button
" > components/ChatHeader.tsx
```

### Tip 2: Use Variables in Prompts

```bash
# Define reusable prompt segments
AUTH_VALIDATION="email format, password >= 8 chars, username unique"
ERROR_HANDLING="try/catch, meaningful messages, logging"
PERFORMANCE="< 500ms latency, cache where possible, optimize queries"

cat << EOF | claude
Generate login endpoint with:
- Validation: $AUTH_VALIDATION
- Error handling: $ERROR_HANDLING
- Performance: $PERFORMANCE
EOF
```

### Tip 3: Combine Multiple Outputs

```bash
# Generate multiple related pieces
cat << 'EOF' | claude > auth-complete.ts
Generate a complete auth flow module with:

1. Types/Interfaces
2. Service (register, login, refresh)
3. Controller (routes)
4. DTOs with validation
5. Error handling
6. Logging

Output as single file with sections separated by:
// ============ SECTION NAME ============
EOF

# Then split if needed
cat auth-complete.ts | awk '/^\/\/ ============/ {section=$0; next} {print >> (section ".ts")}'
```

### Tip 4: Incremental Development

```bash
# Start with types
echo "Generate TypeScript interfaces for: user, session, message" | claude > types.ts

# Then services
cat types.ts | claude > services.ts
# (Claude will see the types and generate compatible services)

# Then controllers
cat services.ts | claude > controllers.ts
# (Claude will see the services and generate proper controllers)

# Then tests
cat services.ts | claude > services.spec.ts
# (Claude will see implementation and generate matching tests)
```

---

## Quick Reference: Common Tasks

### Task: Add a New API Endpoint

```bash
claude << 'EOF'
Add a new POST endpoint to my chat controller at /api/chat/export that:
- Takes sessionId
- Exports chat as JSON
- Returns file for download

My existing controller:
$(cat backend/src/chat/chat.controller.ts)

Add the method, DTO, and service call
EOF
```

### Task: Fix a Bug

```bash
claude << 'EOF'
My messages aren't saving to database.

Service:
$(cat backend/src/chat/chat.service.ts)

Controller:
$(cat backend/src/chat/chat.controller.ts)

Error: MongooseError: $inc must be applied to number

Find and fix the bug.
EOF
```

### Task: Add Tests

```bash
claude << 'EOF'
Generate tests for this service:

$(cat backend/src/chat/chat.service.ts)

Include:
- Happy path tests
- Error scenario tests
- Edge case tests
- Performance tests

Use Jest with mocked Mongoose models
EOF
```

### Task: Optimize Performance

```bash
claude << 'EOF'
My message list is slow (> 2s to load 100 messages).

Current implementation:
$(cat backend/src/chat/chat.service.ts)

MongoDB schema:
$(cat backend/src/chat/schemas/message.schema.ts)

Optimize for:
- Query speed
- Memory usage
- Frontend rendering

Suggest: indexes, pagination, lazy loading
EOF
```

---

## Troubleshooting Claude Terminal

### Issue: Output is too verbose

```bash
# Ask for concise output
echo "Generate code (concise, no explanations, no comments):" | claude
```

### Issue: Output gets cut off

```bash
# Save to file instead of stdout
claude < prompt.txt > output.ts

# Or use tee to see and save
claude < prompt.txt | tee output.ts
```

### Issue: Claude doesn't understand context

```bash
# Provide more context explicitly
cat << 'EOF' | claude
My project structure:
- backend: NestJS
- frontend: React + Zustand
- database: MongoDB
- key files: services, controllers, components

I need help with: [specific task]

Relevant code:
$(cat relevant-file.ts)
EOF
```

---

## Workflow Templates

### Template 1: New Feature (Front to Back)

```bash
#!/bin/bash

FEATURE="User Settings"
BRANCH="feature/user-settings"

# Create branch
git checkout -b $BRANCH

# 1. Frontend component
echo "Generating $FEATURE frontend..."
cat << 'EOF' | claude > frontend/src/pages/Settings.tsx
Generate Settings page...
EOF

# 2. Backend endpoint
echo "Generating $FEATURE backend..."
cat << 'EOF' | claude > backend/src/user/user.controller.ts
Generate User settings controller...
EOF

# 3. Service
cat << 'EOF' | claude > backend/src/user/user.service.ts
Generate User settings service...
EOF

# 4. Tests
echo "Generating tests..."
cat backend/src/user/user.service.ts | claude > backend/src/user/user.service.spec.ts

# 5. Commit
git add .
git commit -m "feat: add $FEATURE"

echo "✅ Feature complete! Ready for PR"
```

### Template 2: Debugging Workflow

```bash
#!/bin/bash

# Log the issue
cat > issue.md << 'EOF'
## Issue
[describe]

## Steps to reproduce
[steps]

## Expected
[what should happen]

## Actual
[what actually happens]
EOF

# Get debug output
npm run dev 2>&1 > debug.log

# Ask Claude
cat << 'EOF' | claude > fix.md
Debug this issue:

$(cat issue.md)

Debug logs:
$(tail -50 debug.log)

Relevant code:
$(cat relevant-file.ts)

Provide:
1. Root cause
2. Step-by-step fix
3. Complete fixed code
EOF

cat fix.md
```

---

## Tips for Best Results

1. **Be specific** - "Generate X with Y features" not "Make a component"
2. **Provide context** - Show existing code, schemas, types
3. **Set expectations** - "Production-ready", "with tests", "optimized"
4. **Iterate** - Refine prompts based on output
5. **Reference examples** - "Similar to existing UserService"
6. **Test output** - Run code immediately to catch issues
7. **Ask for improvements** - "Add error handling", "Optimize this"
8. **Save templates** - Reuse good prompts
9. **Chain operations** - Use output as input for next prompt
10. **Combine with files** - Mix Claude output with your edits

