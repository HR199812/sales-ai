# React Frontend Boilerplate for Sales-AI

## Quick Setup

```bash
cd ~/Documents/sales-ai/frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:3000

---

## File: vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      }
    }
  }
})
```

---

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@services/*": ["src/services/*"],
      "@stores/*": ["src/stores/*"],
      "@types/*": ["src/types/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## File: src/types/index.ts

```typescript
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
  email: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messageCount: number;
  messages?: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tokens?: number;
  timestamp: string;
  isStreaming?: boolean;
}

export interface CreateSessionRequest {
  title: string;
}

export interface SendMessageRequest {
  sessionId: string;
  content: string;
}
```

---

## File: src/stores/authStore.ts

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthResponse } from '@types/index';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  setUser: (user: User) => void;
  setToken: (token: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: true }),
      setToken: (token) => set({ token }),

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('http://localhost:8080/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) throw new Error('Login failed');

          const data: AuthResponse = await response.json();
          set({
            token: data.token,
            user: { id: data.userId, email: data.email } as User,
            isAuthenticated: true,
            isLoading: false,
          });

          localStorage.setItem('token', data.token);
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (email: string, password: string, firstName: string, lastName: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('http://localhost:8080/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, firstName, lastName }),
          });

          if (!response.ok) throw new Error('Registration failed');

          const data: AuthResponse = await response.json();
          set({
            token: data.token,
            user: { id: data.userId, email: data.email } as User,
            isAuthenticated: true,
            isLoading: false,
          });

          localStorage.setItem('token', data.token);
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        localStorage.removeItem('token');
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

---

## File: src/stores/chatStore.ts

```typescript
import { create } from 'zustand';
import { ChatSession, Message } from '@types/index';

interface ChatStore {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isLoading: boolean;
  selectedModel: string;

  createSession: (title: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  setCurrentSession: (id: string) => void;
  fetchSessions: (token: string) => Promise<void>;

  addMessage: (sessionId: string, message: Message) => void;
  appendToMessage: (sessionId: string, messageId: string, chunk: string) => void;
  startStreaming: (sessionId: string, messageId: string) => void;
  stopStreaming: (sessionId: string, messageId: string) => void;

  getCurrentSession: () => ChatSession | null;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  isLoading: false,
  selectedModel: 'claude-opus-4-1',

  createSession: async (title: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    set({ isLoading: true });
    try {
      const response = await fetch('http://localhost:8080/api/chat/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) throw new Error('Failed to create session');

      const session: ChatSession = await response.json();
      set((state) => ({
        sessions: [session, ...state.sessions],
        currentSessionId: session.id,
        isLoading: false,
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteSession: async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    try {
      await fetch(`http://localhost:8080/api/chat/sessions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== id),
        currentSessionId: state.currentSessionId === id ? null : state.currentSessionId,
      }));
    } catch (error) {
      throw error;
    }
  },

  setCurrentSession: (id: string) => set({ currentSessionId: id }),

  fetchSessions: async (token: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch('http://localhost:8080/api/chat/sessions', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch sessions');

      const sessions: ChatSession[] = await response.json();
      set({
        sessions,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  addMessage: (sessionId: string, message: Message) => {
    set((state) => ({
      sessions: state.sessions.map((session) =>
        session.id === sessionId
          ? { ...session, messages: [...(session.messages || []), message] }
          : session
      ),
    }));
  },

  appendToMessage: (sessionId: string, messageId: string, chunk: string) => {
    set((state) => ({
      sessions: state.sessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              messages: (session.messages || []).map((msg) =>
                msg.id === messageId
                  ? { ...msg, content: msg.content + chunk }
                  : msg
              ),
            }
          : session
      ),
    }));
  },

  startStreaming: (sessionId: string, messageId: string) => {
    set((state) => ({
      sessions: state.sessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              messages: (session.messages || []).map((msg) =>
                msg.id === messageId ? { ...msg, isStreaming: true } : msg
              ),
            }
          : session
      ),
    }));
  },

  stopStreaming: (sessionId: string, messageId: string) => {
    set((state) => ({
      sessions: state.sessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              messages: (session.messages || []).map((msg) =>
                msg.id === messageId ? { ...msg, isStreaming: false } : msg
              ),
            }
          : session
      ),
    }));
  },

  getCurrentSession: () => {
    const state = get();
    return state.sessions.find((s) => s.id === state.currentSessionId) || null;
  },
}));
```

---

## File: src/services/api.ts

```typescript
import { AuthCredentials, AuthResponse, ChatSession, CreateSessionRequest } from '@types/index';

const API_URL = 'http://localhost:8080/api';

const getHeaders = (token?: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const authAPI = {
  login: async (credentials: AuthCredentials): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(credentials),
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  },

  register: async (credentials: AuthCredentials): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(credentials),
    });
    if (!response.ok) throw new Error('Registration failed');
    return response.json();
  },
};

export const chatAPI = {
  createSession: async (token: string, request: CreateSessionRequest): Promise<ChatSession> => {
    const response = await fetch(`${API_URL}/chat/sessions`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to create session');
    return response.json();
  },

  getSessions: async (token: string): Promise<ChatSession[]> => {
    const response = await fetch(`${API_URL}/chat/sessions`, {
      headers: getHeaders(token),
    });
    if (!response.ok) throw new Error('Failed to fetch sessions');
    return response.json();
  },

  getSession: async (token: string, sessionId: string): Promise<ChatSession> => {
    const response = await fetch(`${API_URL}/chat/sessions/${sessionId}`, {
      headers: getHeaders(token),
    });
    if (!response.ok) throw new Error('Failed to fetch session');
    return response.json();
  },

  deleteSession: async (token: string, sessionId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/chat/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
    if (!response.ok) throw new Error('Failed to delete session');
  },
};
```

---

## File: src/services/websocket.ts

```typescript
type MessageHandler = (data: any) => void;

class WebSocketManager {
  private socket: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();

  constructor(url: string) {
    this.url = url;
  }

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.send('AUTH', { token });
          this.reconnectAttempts = 0;
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.socket.onclose = () => {
          console.log('WebSocket disconnected');
          this.attemptReconnect(token);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  send(type: string, payload: any): void {
    const message = { type, ...payload };
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  on(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);

    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) handlers.splice(index, 1);
      }
    };
  }

  private handleMessage(data: any): void {
    const handlers = this.messageHandlers.get(data.type);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  private attemptReconnect(token: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      this.reconnectAttempts++;
      setTimeout(() => this.connect(token).catch(() => {}), delay);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

export const wsManager = new WebSocketManager('ws://localhost:8080/ws/chat');

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !wsManager.isConnected()) {
      wsManager.connect(token)
        .then(() => setIsConnected(true))
        .catch(console.error);
    }

    return () => {
      // Don't disconnect on unmount
    };
  }, []);

  return { wsManager, isConnected };
};
```

---

## File: src/components/ChatArea/StreamingMessage.tsx

```typescript
import React, { useEffect, useState } from 'react';
import { Message } from '@types/index';
import './StreamingMessage.css';

interface StreamingMessageProps {
  message: Message;
}

export const StreamingMessage: React.FC<StreamingMessageProps> = ({ message }) => {
  const [displayContent, setDisplayContent] = useState(message.content);

  useEffect(() => {
    if (!message.isStreaming) return;

    const handleStreamChunk = (event: CustomEvent) => {
      setDisplayContent((prev) => prev + event.detail.chunk);
    };

    window.addEventListener(`stream:${message.id}`, handleStreamChunk as EventListener);
    return () => {
      window.removeEventListener(`stream:${message.id}`, handleStreamChunk as EventListener);
    };
  }, [message.id, message.isStreaming]);

  return (
    <div className={`message message-${message.role}`}>
      <div className={`message-avatar ${message.role}`}>
        {message.role === 'user' ? '👤' : '🤖'}
      </div>
      <div className="message-bubble">
        <div className="message-content">
          {displayContent}
          {message.isStreaming && <span className="cursor">▌</span>}
        </div>
        <div className="message-time">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};
```

---

## File: src/components/ChatArea/StreamingMessage.css

```css
.message {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  animation: slideIn 0.3s ease-out;
}

.message-user {
  justify-content: flex-end;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.message-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  background-color: #f0f0f0;
}

.message-user .message-bubble {
  background-color: #0066cc;
  color: white;
}

.message-content {
  line-height: 1.5;
  word-wrap: break-word;
}

.message-time {
  font-size: 12px;
  margin-top: 4px;
  opacity: 0.7;
}

.cursor {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## File: src/components/ChatArea/MessageInput.tsx

```typescript
import React, { useState, useRef } from 'react';
import { useChatStore } from '@stores/chatStore';
import { useWebSocket } from '@services/websocket';
import './MessageInput.css';

interface MessageInputProps {
  sessionId: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({ sessionId }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { wsManager } = useWebSocket();
  const { addMessage, startStreaming, appendToMessage, stopStreaming } = useChatStore();

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();

    // Add user message
    addMessage(sessionId, {
      id: userMessageId,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    });

    // Add assistant placeholder
    addMessage(sessionId, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    });

    setInput('');
    setIsLoading(true);
    startStreaming(sessionId, assistantMessageId);

    try {
      wsManager.send('SEND_MESSAGE', { sessionId, content: input });

      const unsubscribe = wsManager.on('STREAM_CHUNK', (data) => {
        if (data.messageId === assistantMessageId) {
          window.dispatchEvent(
            new CustomEvent(`stream:${assistantMessageId}`, {
              detail: { chunk: data.chunk },
            })
          );
          appendToMessage(sessionId, assistantMessageId, data.chunk);
        }
      });

      await new Promise((resolve) => {
        const handleComplete = (data: any) => {
          if (data.messageId === assistantMessageId) {
            stopStreaming(sessionId, assistantMessageId);
            unsubscribe();
            wsManager.on('MESSAGE_COMPLETE', handleComplete);
            resolve(null);
          }
        };
        wsManager.on('MESSAGE_COMPLETE', handleComplete);
      });
    } catch (error) {
      console.error('Error sending message:', error);
      stopStreaming(sessionId, assistantMessageId);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSendMessage();
    }
  };

  return (
    <div className="message-input-container">
      <textarea
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message (Ctrl+Enter to send)..."
        disabled={isLoading}
        rows={3}
      />
      <div className="input-actions">
        <button
          onClick={handleSendMessage}
          disabled={!input.trim() || isLoading}
          className="send-button"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};
```

---

## File: src/components/ChatArea/MessageInput.css

```css
.message-input-container {
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 12px;
  background-color: #ffffff;
}

.message-input-container textarea {
  flex: 1;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
}

.message-input-container textarea:focus {
  outline: none;
  border-color: #0066cc;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.input-actions {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.send-button {
  padding: 12px 24px;
  background-color: #0066cc;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.send-button:hover:not(:disabled) {
  background-color: #0052a3;
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## Dockerfile for React

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

