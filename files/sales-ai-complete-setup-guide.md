# Sales-AI Complete Setup Guide (Spring Boot + React)

## Project Overview

**Sales-AI** is a full-stack AI chat application built with:
- **Backend**: Spring Boot 3.0+ (Java 17)
- **Frontend**: React 18 + TypeScript + Vite
- **Database**: MySQL 8.0
- **Real-time**: WebSocket (Spring WebSocket)
- **AI Integration**: Claude API with streaming

---

## Prerequisites

```bash
# Check Java version (requires 17+)
java -version

# Check Maven version (3.6+)
mvn -v

# Check Node.js version (18+)
node --version
npm --version

# Check MySQL version (8.0+)
mysql --version

# Docker (optional, for containerized setup)
docker --version
docker-compose --version
```

**Install if missing:**
- macOS: `brew install java17 maven node mysql`
- Ubuntu: `sudo apt install openjdk-17-jdk maven nodejs npm mysql-server`
- Windows: Download from official websites

---

## Directory Structure

```
~/Documents/sales-ai/
├── backend/                      # Spring Boot application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/salesai/
│   │   │   │   ├── SalesAiApplication.java
│   │   │   │   ├── entity/          # JPA entities
│   │   │   │   ├── repository/      # JPA repositories
│   │   │   │   ├── service/         # Business logic
│   │   │   │   ├── controller/      # REST controllers
│   │   │   │   ├── config/          # Configuration
│   │   │   │   ├── security/        # JWT & Auth
│   │   │   │   └── dto/             # Data transfer objects
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       └── application-dev.yml
│   │   └── test/
│   ├── pom.xml
│   └── Dockerfile
│
├── frontend/                     # React + TypeScript application
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatArea/
│   │   │   ├── Sidebar/
│   │   │   └── Auth/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── Dockerfile
│
├── docker-compose.yml           # Docker Compose configuration
├── .env.example                 # Environment variables template
├── .gitignore
└── README.md
```

---

## Step 1: Clone/Create Project Structure

### Option A: Using Cowork (Automated)

```bash
cowork setup-sales-ai-project
```

This will automatically create the entire directory structure, download templates, and initialize git.

### Option B: Manual Setup

```bash
# Navigate to Documents
cd ~/Documents

# Create project directory
mkdir -p sales-ai
cd sales-ai

# Create subdirectories
mkdir -p backend/src/main/{java/com/salesai,resources}
mkdir -p backend/src/test/java/com/salesai
mkdir -p frontend/src/{components,pages,services,stores,types}
mkdir -p config docker docs

# Initialize Git
git init
git config user.name "Your Name"
git config user.email "your@email.com"

# Create .gitignore
cat > .gitignore << 'EOF'
# Backend
backend/target/
backend/.classpath
backend/.idea/
backend/*.iml

# Frontend
frontend/node_modules/
frontend/dist/
frontend/build/

# IDE
.vscode/
.idea/

# Environment
.env
.env.local

# OS
.DS_Store
Thumbs.db
EOF

git add .
git commit -m "Initial commit: Project structure"
```

---

## Step 2: Backend Setup (Spring Boot)

### 2.1 Create pom.xml

Copy the pom.xml from `spring-boot-backend-boilerplate.md` to `backend/pom.xml`

### 2.2 Create Spring Boot Classes

Copy all Java files from `spring-boot-backend-boilerplate.md`:
- `SalesAiApplication.java`
- All entity classes (User, ChatSession, Message)
- All repository classes
- All service classes
- All controller classes
- Configuration classes (SecurityConfig, WebSocketConfig, etc.)
- DTOs

### 2.3 Create Configuration Files

**backend/src/main/resources/application.yml**
```yaml
spring:
  application:
    name: sales-ai-backend
  datasource:
    url: jdbc:mysql://localhost:3306/sales_ai_db
    username: root
    password: password
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false

server:
  port: 8080

jwt:
  secret: your-secret-key-min-32-chars
  expiration: 86400000

claude:
  api-key: ${CLAUDE_API_KEY}
```

### 2.4 Build and Run

```bash
cd backend

# Download dependencies (first time only)
mvn clean install

# Run the application
mvn spring-boot:run

# Should see: "Started SalesAiApplication in X seconds"
# Backend running at: http://localhost:8080
```

### 2.5 Test Backend Health

```bash
curl http://localhost:8080/api/auth/health
# Should return: "Backend is running"
```

---

## Step 3: Frontend Setup (React)

### 3.1 Initialize React Project

```bash
cd frontend

# Install dependencies
npm install

# Verify installation
npm list react react-dom zustand
```

### 3.2 Create vite.config.ts

Copy from `react-frontend-boilerplate.md`

### 3.3 Create tsconfig.json

Copy from `react-frontend-boilerplate.md`

### 3.4 Create Source Files

Create directory structure:
```bash
mkdir -p src/{components,pages,services,stores,types}
```

Copy all files from `react-frontend-boilerplate.md`:
- src/types/index.ts
- src/stores/authStore.ts
- src/stores/chatStore.ts
- src/services/api.ts
- src/services/websocket.ts
- src/components/ChatArea/StreamingMessage.tsx
- src/components/ChatArea/MessageInput.tsx
- And corresponding CSS files

### 3.5 Create App.tsx

```typescript
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useChatStore } from './stores/chatStore';

// Import pages
// import LoginPage from './pages/LoginPage';
// import ChatPage from './pages/ChatPage';

function App() {
  const { token, isAuthenticated, user } = useAuthStore();
  const { fetchSessions } = useChatStore();

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchSessions(token);
    }
  }, [isAuthenticated, token]);

  return (
    <BrowserRouter>
      <Routes>
        {!isAuthenticated ? (
          <>
            {/* <Route path="/login" element={<LoginPage />} /> */}
            {/* <Route path="/register" element={<RegisterPage />} /> */}
            {/* <Route path="*" element={<Navigate to="/login" />} /> */}
          </>
        ) : (
          <>
            {/* <Route path="/chat" element={<ChatPage />} /> */}
            {/* <Route path="*" element={<Navigate to="/chat" />} /> */}
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

### 3.6 Create index.css

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --primary: #0066cc;
  --primary-dark: #0052a3;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --border: #e0e0e0;
}

@media (prefers-color-scheme: dark) {
  :root {
    --text-primary: #ffffff;
    --text-secondary: #cccccc;
    --bg-primary: #1a1a1a;
    --bg-secondary: #2a2a2a;
    --border: #3a3a3a;
  }
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

#root {
  width: 100%;
  height: 100vh;
}
```

### 3.7 Run Frontend

```bash
cd frontend
npm run dev

# Should see:
# ➜  Local:   http://localhost:5173/
# ➜  press h + enter to show help
```

Visit http://localhost:3000 (if configured) or http://localhost:5173

---

## Step 4: Database Setup (MySQL)

### 4.1 Start MySQL

**macOS (via Homebrew):**
```bash
brew services start mysql
```

**Ubuntu (via apt):**
```bash
sudo service mysql start
```

**Docker:**
```bash
docker run -d \
  --name sales-ai-mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=sales_ai_db \
  -p 3306:3306 \
  mysql:8.0
```

### 4.2 Create Database

```bash
# Connect to MySQL
mysql -u root -p

# In MySQL shell:
CREATE DATABASE sales_ai_db;
USE sales_ai_db;
SHOW TABLES;

# Exit
exit
```

### 4.3 Verify Connection

Spring Boot will automatically create tables via Hibernate on first run.

```bash
# Check tables after running backend
mysql -u root -p sales_ai_db
SHOW TABLES;
# Should show: users, chat_sessions, messages
```

---

## Step 5: Environment Configuration

### 5.1 Create .env File

```bash
cd ~/Documents/sales-ai

# Copy example
cp .env.example .env

# Edit with your values
nano .env  # or use your editor
```

**.env Content:**
```bash
# Backend
BACKEND_PORT=8080
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/sales_ai_db
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=password
SPRING_JPA_HIBERNATE_DDL_AUTO=update

# Database
MYSQL_ROOT_PASSWORD=password
MYSQL_DATABASE=sales_ai_db

# JWT
JWT_SECRET=your-super-secret-key-at-least-32-characters-long-required
JWT_EXPIRATION=86400000

# Claude API
CLAUDE_API_KEY=sk-ant-your-key-here

# Frontend
FRONTEND_PORT=3000
REACT_APP_API_URL=http://localhost:8080
REACT_APP_WS_URL=ws://localhost:8080

# Environment
ENVIRONMENT=development
```

---

## Step 6: Run Everything

### Option A: Run Separately (Development)

**Terminal 1: Database**
```bash
# MySQL should be running in background
# Or start it:
brew services start mysql
```

**Terminal 2: Backend**
```bash
cd ~/Documents/sales-ai/backend
mvn spring-boot:run
```

**Terminal 3: Frontend**
```bash
cd ~/Documents/sales-ai/frontend
npm run dev
```

### Option B: Run with Docker Compose (Production-like)

```bash
cd ~/Documents/sales-ai

# Build and start all services
docker-compose up --build

# Should see:
# sales-ai-mysql ... running
# sales-ai-backend ... running
# sales-ai-frontend ... running

# To stop:
# Press Ctrl+C or run:
docker-compose down
```

---

## Step 7: Test the Application

### 7.1 Test Backend API

```bash
# Health check
curl http://localhost:8080/api/auth/health

# Register user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Should return: {"token": "...", "userId": 1, "email": "test@example.com"}
```

### 7.2 Test Frontend

1. Open http://localhost:3000 (or http://localhost:5173)
2. Register with test@example.com / password123
3. Should be redirected to chat page
4. Create a new chat session
5. Send a message
6. Should see response streaming in real-time

### 7.3 Check Database

```bash
mysql -u root -p sales_ai_db

# View users
SELECT * FROM users;

# View sessions
SELECT * FROM chat_sessions;

# View messages
SELECT * FROM messages;

exit
```

---

## Troubleshooting

### Backend Won't Start

**Error: "Connection refused"**
```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1;"

# If not, start it:
brew services start mysql  # macOS
sudo service mysql start   # Ubuntu
docker run -d ... mysql:8.0  # Docker
```

**Error: "Port 8080 already in use"**
```bash
# Change port in application.yml
server:
  port: 8081

# Or kill the process:
lsof -i :8080
kill -9 <PID>
```

### Frontend Won't Connect

**Error: "Failed to fetch"**
```bash
# Check backend is running
curl http://localhost:8080/api/auth/health

# Check CORS configuration in SecurityConfig
# Should allow http://localhost:3000
```

**WebSocket connection fails**
```bash
# Check WebSocket endpoint
ws://localhost:8080/ws/chat

# Verify in browser DevTools → Network → WS
```

### Database Issues

**Error: "Unknown database"**
```bash
# Create database manually
mysql -u root -p
CREATE DATABASE sales_ai_db;
EXIT;

# Then restart backend
```

**Error: "Access denied for user 'root'@'localhost'"**
```bash
# Check credentials in application.yml
# Default: username=root, password=password

# Or change in MySQL:
mysql -u root
ALTER USER 'root'@'localhost' IDENTIFIED BY 'newpassword';
FLUSH PRIVILEGES;
EXIT;
```

---

## Development Workflow

### Adding a New Feature

1. **Backend**: Create entity, repository, service, controller
2. **Frontend**: Create components, hooks, API calls
3. **Database**: Run migrations (Hibernate handles auto-update)
4. **Test**: Use curl for API, browser DevTools for frontend

### Example: Add User Profile Endpoint

**Backend (Spring Boot):**
```java
@GetMapping("/users/profile")
public ResponseEntity<UserDto> getProfile(Authentication auth) {
    String email = auth.getName();
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new NotFoundException("User not found"));
    return ResponseEntity.ok(UserDto.from(user));
}
```

**Frontend (React):**
```typescript
const fetchProfile = async (token: string) => {
  const response = await fetch('http://localhost:8080/api/users/profile', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return response.json();
};
```

---

## Deployment

### Build for Production

**Backend:**
```bash
cd backend
mvn clean package
# JAR created at: target/sales-ai-backend-1.0.0.jar

# Run JAR:
java -jar target/sales-ai-backend-1.0.0.jar
```

**Frontend:**
```bash
cd frontend
npm run build
# Built files at: dist/

# Serve with:
npx serve dist
```

### Deploy with Docker

```bash
# Build images
docker build -t sales-ai-backend:latest ./backend
docker build -t sales-ai-frontend:latest ./frontend

# Push to registry
docker tag sales-ai-backend:latest yourregistry/sales-ai-backend:latest
docker push yourregistry/sales-ai-backend:latest

# Deploy to Kubernetes/Cloud Run
```

---

## Monitoring & Logs

### Backend Logs

```bash
# Real-time logs
tail -f backend/logs/application.log

# Or in Spring Boot console:
# [INFO] SalesAiApplication : Starting SalesAiApplication...
# [DEBUG] ChatController : Received request...
```

### Frontend Logs

```bash
# Browser DevTools → Console
# Watch for network requests → Network tab
# Check WebSocket → Inspect element
```

### Database Logs

```bash
# View slow queries
mysql -u root -p -e "SET GLOBAL slow_query_log='ON';"

# Monitor connections
mysql -u root -p -e "SHOW PROCESSLIST;"
```

---

## Next Steps

1. ✅ Setup complete - run all services
2. 📝 Implement Claude API streaming (backend: ClaudeService.java)
3. 🧪 Add authentication UI (frontend login/register pages)
4. 🎨 Style the chat interface
5. 📱 Make responsive for mobile
6. 🚀 Deploy to cloud (AWS/Google Cloud/Azure)
7. 📊 Add monitoring and analytics

---

## Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [React Documentation](https://react.dev)
- [MySQL Documentation](https://dev.mysql.com/doc)
- [Claude API Documentation](https://docs.anthropic.com)
- [WebSocket Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

---

## Support

For issues or questions:
1. Check logs: `tail -f backend/logs/*.log`
2. Verify services: `curl http://localhost:8080/api/auth/health`
3. Check database: `mysql -u root -p sales_ai_db -e "SHOW TABLES;"`
4. Review browser console for frontend errors

