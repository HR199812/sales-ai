import type {
	AuthCredentials,
	AuthResponse,
	ChatSession,
	CreateSessionRequest,
} from "../types/index";

const getHeaders = (token?: string): HeadersInit => {
	const headers: HeadersInit = { "Content-Type": "application/json" };
	if (token) headers["Authorization"] = `Bearer ${token}`;
	return headers;
};

export const authAPI = {
	login: async (credentials: AuthCredentials): Promise<AuthResponse> => {
		const response = await fetch("/api/auth/login", {
			method: "POST",
			headers: getHeaders(),
			body: JSON.stringify(credentials),
		});
		if (!response.ok) {
			const err = await response.json();
			throw new Error(err.error || "Login failed");
		}
		return response.json();
	},

	register: async (credentials: AuthCredentials): Promise<AuthResponse> => {
		const response = await fetch("/api/auth/register", {
			method: "POST",
			headers: getHeaders(),
			body: JSON.stringify(credentials),
		});
		if (!response.ok) {
			const err = await response.json();
			throw new Error(err.error || "Registration failed");
		}
		return response.json();
	},
};

export const chatAPI = {
	createSession: async (
		token: string,
		request: CreateSessionRequest,
	): Promise<ChatSession> => {
		const response = await fetch("/api/chat/sessions", {
			method: "POST",
			headers: getHeaders(token),
			body: JSON.stringify(request),
		});
		if (!response.ok) throw new Error("Failed to create session");
		return response.json();
	},

	getSessions: async (token: string): Promise<ChatSession[]> => {
		const response = await fetch("/api/chat/sessions", {
			headers: getHeaders(token),
		});
		if (!response.ok) throw new Error("Failed to fetch sessions");
		return response.json();
	},

	getSession: async (
		token: string,
		sessionId: string,
	): Promise<ChatSession> => {
		const response = await fetch(`/api/chat/sessions/${sessionId}`, {
			headers: getHeaders(token),
		});
		if (!response.ok) throw new Error("Failed to fetch session");
		return response.json();
	},

	deleteSession: async (token: string, sessionId: string): Promise<void> => {
		const response = await fetch(`/api/chat/sessions/${sessionId}`, {
			method: "DELETE",
			headers: getHeaders(token),
		});
		if (!response.ok) throw new Error("Failed to delete session");
	},
};
