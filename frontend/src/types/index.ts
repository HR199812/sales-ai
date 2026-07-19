export interface User {
	id: string;
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
	userId: string;
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
	role: "user" | "assistant";
	content: string;
	tokens?: number;
	timestamp: string;
	isStreaming?: boolean;
	agentState?: string | null;
}

export interface CreateSessionRequest {
	title: string;
}

export interface SendMessageRequest {
	sessionId: string;
	content: string;
}
