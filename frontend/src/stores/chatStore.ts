import { create } from "zustand";
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

	addMessage: (sessionId: string, message: Message) => void;
	appendToMessage: (
		sessionId: string,
		messageId: string,
		chunk: string,
	) => void;
	startStreaming: (sessionId: string, messageId: string) => void;
	stopStreaming: (sessionId: string, messageId: string) => void;
	setMessageAgentState: (
		sessionId: string,
		messageId: string,
		state: string | null,
	) => void;

	getCurrentSession: () => ChatSession | null;
}

export const useChatStore = create<ChatStore>((set, get) => ({
	sessions: [],
	currentSessionId: null,
	isLoading: false,
	selectedModel: "claude-sonnet-4-6",

	createSession: async (title: string) => {
		const token = localStorage.getItem("token");
		if (!token) throw new Error("Not authenticated");

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
		const token = localStorage.getItem("token");
		if (!token) throw new Error("Not authenticated");

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
		set({ isLoading: true });
		try {
			const response = await fetch("/api/chat/sessions", {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) throw new Error("Failed to fetch sessions");

			const sessions: ChatSession[] = await response.json();
			set({ sessions, isLoading: false });
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

	setMessageAgentState: (
		sessionId: string,
		messageId: string,
		state: string | null,
	) => {
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
}));
