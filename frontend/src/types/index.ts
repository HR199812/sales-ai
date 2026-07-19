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

export interface MessageAttachment {
	name: string;
	size: number;
	mimeType: string;
	dataUrl?: string; // base64 data URL for images; absent for non-previewable files
}

export interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	tokens?: number;
	timestamp: string;
	isStreaming?: boolean;
	agentState?: string | null;
	attachments?: MessageAttachment[];
}

export interface CreateSessionRequest {
	title: string;
}

export interface SendMessageRequest {
	sessionId: string;
	content: string;
}
