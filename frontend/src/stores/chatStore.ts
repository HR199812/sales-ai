import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatSession, Message } from "../types/index";

interface ChatStore {
	sessions: ChatSession[];
	currentSessionId: string | null;
	isLoading: boolean;
	selectedModel: string;

	createSession: (title: string) => Promise<void>;
	deleteSession: (id: string) => Promise<void>;
	setCurrentSession: (id: string | null) => void;
	fetchSessions: (token: string) => Promise<void>;

	clearSessionMessages: (sessionId: string) => void;
	addMessage: (sessionId: string, message: Message) => void;
	appendToMessage: (sessionId: string, messageId: string, chunk: string) => void;
	startStreaming: (sessionId: string, messageId: string) => void;
	stopStreaming: (sessionId: string, messageId: string) => void;
	setMessageAgentState: (sessionId: string, messageId: string, state: string | null) => void;

	getCurrentSession: () => ChatSession | null;
}

export const useChatStore = create<ChatStore>()(
	persist(
		(set, get) => ({
			sessions: [],
			currentSessionId: null,
			isLoading: false,
			selectedModel: "claude-sonnet-4-6",

			createSession: async (title: string) => {
				const token = localStorage.getItem("token");

				// Guest mode — create session locally without backend
				if (!token) {
					const session: ChatSession = {
						id: crypto.randomUUID(),
						title,
						messages: [],
						messageCount: 0,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					};
					set((state) => ({
						sessions: [session, ...state.sessions],
						currentSessionId: session.id,
					}));
					return;
				}

				set({ isLoading: true });
				try {
					const response = await fetch("/api/chat/sessions", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${token}`,
						},
						body: JSON.stringify({ title }),
					});
					if (!response.ok) throw new Error("Failed to create session");
					const session: ChatSession = await response.json();
					set((state) => ({
						sessions: [{ ...session, messages: [] }, ...state.sessions],
						currentSessionId: session.id,
						isLoading: false,
					}));
				} catch (error) {
					set({ isLoading: false });
					throw error;
				}
			},

			deleteSession: async (id: string) => {
				const token = localStorage.getItem("token");

				// Guest mode — delete from local store only
				if (!token) {
					set((state) => ({
						sessions: state.sessions.filter((s) => s.id !== id),
						currentSessionId: state.currentSessionId === id ? null : state.currentSessionId,
					}));
					return;
				}

				try {
					await fetch(`/api/chat/sessions/${id}`, {
						method: "DELETE",
						headers: { Authorization: `Bearer ${token}` },
					});
					set((state) => ({
						sessions: state.sessions.filter((s) => s.id !== id),
						currentSessionId:
							state.currentSessionId === id ? null : state.currentSessionId,
					}));
				} catch (error) {
					throw error;
				}
			},

			setCurrentSession: (id: string | null) => set({ currentSessionId: id }),

			fetchSessions: async (token: string) => {
				// Use cached sessions from localStorage first — only fetch from backend
				// if we have no local data at all (first visit or cleared storage).
				const cached = get().sessions;
				if (cached.length > 0) return;

				set({ isLoading: true });
				try {
					const response = await fetch("/api/chat/sessions", {
						headers: { Authorization: `Bearer ${token}` },
					});
					if (!response.ok) throw new Error("Failed to fetch sessions");
					const sessions: ChatSession[] = await response.json();
					// Seed localStorage with server sessions (messages will be empty)
					set({ sessions: sessions.map((s) => ({ ...s, messages: [] })), isLoading: false });
				} catch {
					set({ isLoading: false });
				}
			},

			clearSessionMessages: (sessionId: string) => {
				set((state) => ({
					sessions: state.sessions.map((s) =>
						s.id === sessionId ? { ...s, messages: [], messageCount: 0 } : s,
					),
				}));
			},

			addMessage: (sessionId: string, message: Message) => {
				set((state) => ({
					sessions: state.sessions.map((session) =>
						session.id === sessionId
							? {
									...session,
									messages: [...(session.messages || []), message],
									messageCount: (session.messageCount || 0) + 1,
									updatedAt: new Date().toISOString(),
								}
							: session,
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
											: msg,
									),
								}
							: session,
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
										msg.id === messageId ? { ...msg, isStreaming: true } : msg,
									),
								}
							: session,
					),
				}));
			},

			setMessageAgentState: (sessionId: string, messageId: string, state: string | null) => {
				set((store) => ({
					sessions: store.sessions.map((session) =>
						session.id === sessionId
							? {
									...session,
									messages: (session.messages || []).map((msg) =>
										msg.id === messageId ? { ...msg, agentState: state } : msg,
									),
								}
							: session,
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
										msg.id === messageId
											? { ...msg, isStreaming: false, agentState: null }
											: msg,
									),
								}
							: session,
					),
				}));
			},

			getCurrentSession: () => {
				const state = get();
				return state.sessions.find((s) => s.id === state.currentSessionId) || null;
			},
		}),
		{
			name: "sales-ai-chat-history",
			// Only persist stable fields — drop transient streaming state on save
			partialize: (state) => ({
				sessions: state.sessions.map((s) => ({
					...s,
					messages: (s.messages ?? []).map((m) => ({
						...m,
						isStreaming: false,
						agentState: null,
					})),
				})),
				currentSessionId: state.currentSessionId,
			}),
		},
	),
);
