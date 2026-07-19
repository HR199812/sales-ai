# Cowork Automation: Sales-AI Project Setup

## Quick Start: Cowork Command

```bash
# Run this Cowork command to automatically set up everything:
cowork setup-sales-ai-project
```

---

## Complete Setup with Cowork

### Step 1: Create Project Structure

Save this as `setup-sales-ai.cowork`:

```cowork
# Setup Sales-AI Project Structure
workflow SetupSalesAI {
  
  # Create main directory
  action CreateDirectory {
    path: ~/Documents/sales-ai
    description: "Create sales-ai project root"
  }
  
  # Create backend (Spring Boot)
  action CreateDirectory {
    path: ~/Documents/sales-ai/backend
    description: "Spring Boot backend directory"
  }
  
  action CreateDirectory {
    path: ~/Documents/sales-ai/backend/src/main/java/com/salesai
    description: "Java source directory"
  }
  
  action CreateDirectory {
    path: ~/Documents/sales-ai/backend/src/main/resources
    description: "Application resources"
  }
  
  action CreateDirectory {
    path: ~/Documents/sales-ai/backend/src/test/java/com/salesai
    description: "Test directory"
  }
  
  # Create frontend (React)
  action CreateDirectory {
    path: ~/Documents/sales-ai/frontend/src/components
    description: "React components"
  }
  
  action CreateDirectory {
    path: ~/Documents/sales-ai/frontend/src/pages
    description: "React pages"
  }
  
  action CreateDirectory {
    path: ~/Documents/sales-ai/frontend/src/services
    description: "Frontend services"
  }
  
  action CreateDirectory {
    path: ~/Documents/sales-ai/frontend/src/stores
    description: "Zustand stores"
  }
  
  action CreateDirectory {
    path: ~/Documents/sales-ai/frontend/src/types
    description: "TypeScript types"
  }
  
  # Create shared configuration directory
  action CreateDirectory {
    path: ~/Documents/sales-ai/config
    description: "Shared configuration"
  }
  
  action CreateDirectory {
    path: ~/Documents/sales-ai/docker
    description: "Docker files"
  }
  
  action CreateDirectory {
    path: ~/Documents/sales-ai/docs
    description: "Documentation"
  }
}
```

### Step 2: Create Configuration Files

```cowork
# Create .env files
action CreateFile {
  path: ~/Documents/sales-ai/.env.example
  content: """
# Backend (Spring Boot)
BACKEND_PORT=8080
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/sales_ai_db
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=password
SPRING_JPA_HIBERNATE_DDL_AUTO=update
SPRING_PROFILES_ACTIVE=dev

# Database
MYSQL_ROOT_PASSWORD=password
MYSQL_DATABASE=sales_ai_db

# JWT
JWT_SECRET=your-secret-key-change-in-production-min-32-chars
JWT_EXPIRATION=86400000

# Claude API
CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxx

# Frontend
FRONTEND_PORT=3000
REACT_APP_API_URL=http://localhost:8080
REACT_APP_WS_URL=ws://localhost:8080

# Environment
ENVIRONMENT=development
"""
}

action CreateFile {
  path: ~/Documents/sales-ai/.gitignore
  content: """
# Backend
backend/target/
backend/.classpath
backend/.project
backend/.settings/
backend/.idea/
backend/*.iml
backend/bin/
backend/out/
backend/.vscode/

# Frontend
frontend/node_modules/
frontend/dist/
frontend/build/
frontend/.env.local
frontend/.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local

# Logs
logs/
*.log
"""
}

action CreateFile {
  path: ~/Documents/sales-ai/README.md
  content: """
# Sales-AI: ChatGPT-like Application for Sales

Full-stack AI chat application with Spring Boot backend and React frontend.

## Quick Start

### Prerequisites
- Java 17+
- Node.js 18+
- MySQL 8.0+
- Docker (optional)

### Setup

#### Backend (Spring Boot)
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Backend runs on: http://localhost:8080

#### Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: http://localhost:3000

### Docker Setup
```bash
docker-compose up --build
```

## Architecture

- **Backend**: Spring Boot 3.0+ with WebSocket support
- **Frontend**: React 18 + TypeScript + Zustand
- **Database**: MySQL with JPA/Hibernate
- **AI**: Claude API integration with streaming
- **Real-time**: WebSocket for bi-directional communication

## Project Structure

```
sales-ai/
├── backend/              # Spring Boot application
│   ├── src/
│   │   ├── main/java/
│   │   └── resources/
│   ├── pom.xml
│   └── Dockerfile
├── frontend/             # React application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── docs/                 # Documentation
```

## Features

- ✅ Real-time chat with streaming responses
- ✅ Chat history persistence
- ✅ User authentication (JWT)
- ✅ WebSocket communication
- ✅ Claude API integration
- ✅ Responsive design
- ✅ Dark mode support

## Development

### Running Tests

Backend:
```bash
cd backend
mvn test
```

Frontend:
```bash
cd frontend
npm run test
```

### Building for Production

Backend:
```bash
cd backend
mvn clean package
```

Frontend:
```bash
cd frontend
npm run build
```

## API Documentation

See `docs/API.md` for detailed endpoint documentation.

## Contributing

1. Create a feature branch
2. Make changes
3. Run tests
4. Submit PR

## License

MIT
"""
}
```

### Step 3: Initialize Git Repositories

```cowork
action RunCommand {
  path: ~/Documents/sales-ai
  command: git init
  description: "Initialize main git repository"
}

action RunCommand {
  path: ~/Documents/sales-ai/backend
  command: git init
  description: "Initialize backend repository"
}

action RunCommand {
  path: ~/Documents/sales-ai/frontend
  command: git init
  description: "Initialize frontend repository"
}
```

### Step 4: Create Maven pom.xml (Spring Boot)

```cowork
action CreateFile {
  path: ~/Documents/sales-ai/backend/pom.xml
  content: """
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.salesai</groupId>
    <artifactId>sales-ai-backend</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <name>Sales-AI Backend</name>
    <description>Spring Boot Backend for Sales-AI Chat Application</description>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.1.0</version>
        <relativePath/>
    </parent>

    <properties>
        <java.version>17</java.version>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <!-- Spring Boot Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-websocket</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- Database -->
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <version>8.0.33</version>
            <scope>runtime</scope>
        </dependency>

        <!-- JWT -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.12.3</version>
        </dependency>

        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>0.12.3</version>
            <scope>runtime</scope>
        </dependency>

        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>0.12.3</version>
            <scope>runtime</scope>
        </dependency>

        <!-- HTTP Client -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-webflux</artifactId>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Testing -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>

        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
"""
}
```

### Step 5: Create React package.json

```cowork
action CreateFile {
  path: ~/Documents/sales-ai/frontend/package.json
  content: """
{
  "name": "sales-ai-frontend",
  "version": "1.0.0",
  "description": "Sales-AI Chat Application Frontend",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives",
    "format": "prettier --write src"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.14.0",
    "zustand": "^4.3.9",
    "axios": "^1.4.0",
    "socket.io-client": "^4.7.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.3",
    "eslint": "^8.45.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.3",
    "prettier": "^3.0.0",
    "typescript": "^5.1.6",
    "vite": "^4.4.5",
    "vitest": "^0.34.0"
  }
}
"""
}
```

### Step 6: Create Docker Compose

```cowork
action CreateFile {
  path: ~/Documents/sales-ai/docker-compose.yml
  content: """
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: sales-ai-mysql
    environment:
      MYSQL_ROOT_PASSWORD: \${MYSQL_ROOT_PASSWORD:-password}
      MYSQL_DATABASE: \${MYSQL_DATABASE:-sales_ai_db}
      MYSQL_USER: salesai
      MYSQL_PASSWORD: salesai123
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: sales-ai-backend
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/sales_ai_db
      SPRING_DATASOURCE_USERNAME: salesai
      SPRING_DATASOURCE_PASSWORD: salesai123
      CLAUDE_API_KEY: \${CLAUDE_API_KEY}
      JWT_SECRET: \${JWT_SECRET}
    depends_on:
      mysql:
        condition: service_healthy
    volumes:
      - ./backend/src:/app/src
    command: mvn spring-boot:run

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: sales-ai-frontend
    ports:
      - "3000:3000"
    environment:
      REACT_APP_API_URL: http://localhost:8080
      REACT_APP_WS_URL: ws://localhost:8080
    depends_on:
      - backend
    volumes:
      - ./frontend/src:/app/src

volumes:
  mysql_data:
"""
}
```

---

## Manual Setup Instructions

### If Cowork Automation Doesn't Work, Use These Commands:

```bash
#!/bin/bash

# Navigate to Documents
cd ~/Documents

# Create project root
mkdir -p sales-ai
cd sales-ai

# Create backend structure
mkdir -p backend/src/main/{java/com/salesai,resources}
mkdir -p backend/src/test/java/com/salesai

# Create frontend structure
mkdir -p frontend/src/{components,pages,services,stores,types}

# Create other directories
mkdir -p config docker docs

# Create essential files (see above for content)
touch .env.example .gitignore README.md
touch backend/pom.xml backend/Dockerfile
touch frontend/package.json frontend/Dockerfile
touch docker-compose.yml

# Initialize git
git init
git add .
git commit -m "Initial commit: Project structure"

echo "✅ Sales-AI project structure created!"
```

---

## Next Steps After Setup

### 1. Fill Backend Spring Boot Code

```bash
cd backend
# Copy Spring Boot boilerplate (see separate file)
```

### 2. Initialize Frontend

```bash
cd frontend
npm install
```

### 3. Configure Environment

```bash
# Copy and customize
cp .env.example .env
# Edit .env with your credentials
```

### 4. Start Development

```bash
# Terminal 1: Backend
cd backend
mvn spring-boot:run

# Terminal 2: Frontend
cd frontend
npm run dev

# Or use Docker Compose
docker-compose up --build
```

---

## Cowork Advanced Features

### Watch Files and Auto-Deploy

```cowork
trigger FileChange {
  path: ~/Documents/sales-ai/backend/src
  action: mvn clean package
  onSuccess: docker-compose up backend
}
```

### Daily Backup

```cowork
trigger Schedule {
  time: "00:00"
  action: RunCommand {
    command: "tar -czf backup-\$(date +%Y%m%d).tar.gz ~/Documents/sales-ai"
  }
}
```

### Auto-format Code

```cowork
trigger FileChange {
  path: ~/Documents/sales-ai/frontend/src
  action: npm run format
}
```

