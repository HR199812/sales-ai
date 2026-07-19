import { useEffect, useState } from "react";

type MessageHandler = (data: Record<string, unknown>) => void;

class WebSocketManager {
	private socket: WebSocket | null = null;
	private readonly url: string;
	private reconnectAttempts = 0;
	private readonly maxReconnectAttempts = 5;
	private messageHandlers: Map<string, MessageHandler[]> = new Map();
	private messageQueue: Array<{ type: string; payload: unknown }> = [];

	constructor(url: string) {
		this.url = url;
	}

	connect(token: string): Promise<void> {
		return new Promise((resolve, reject) => {
			try {
				this.socket = new WebSocket(this.url);

				this.socket.onopen = () => {
					console.log("WebSocket connected");
					this.send("AUTH", { token });
					this.reconnectAttempts = 0;
					this.flushQueue();
					resolve();
				};

				this.socket.onmessage = (event) => {
					try {
						const data = JSON.parse(event.data as string) as Record<
							string,
							unknown
						>;
						this.handleMessage(data);
					} catch (error) {
						console.error("Failed to parse message:", error);
					}
				};

				this.socket.onerror = (error) => {
					console.error("WebSocket error:", error);
					reject(error);
				};

				this.socket.onclose = () => {
					console.log("WebSocket disconnected");
					this.attemptReconnect(token);
				};
			} catch (error) {
				reject(error);
			}
		});
	}

	send(type: string, payload: unknown): void {
		const message = { type, ...(payload as object) };
		if (this.socket?.readyState === WebSocket.OPEN) {
			this.socket.send(JSON.stringify(message));
		} else {
			this.messageQueue.push({ type, payload });
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

	private handleMessage(data: Record<string, unknown>): void {
		const handlers = this.messageHandlers.get(data.type as string);
		if (handlers) {
			handlers.forEach((handler) => handler(data));
		}
	}

	private flushQueue(): void {
		while (this.messageQueue.length > 0) {
			const item = this.messageQueue.shift();
			if (item) this.send(item.type, item.payload);
		}
	}

	private attemptReconnect(token: string): void {
		if (this.reconnectAttempts < this.maxReconnectAttempts) {
			const delay = 2 ** this.reconnectAttempts * 1000;
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

export const wsManager = new WebSocketManager(
	"ws://localhost:8080/api/ws/chat",
);

export const useWebSocket = () => {
	const [isConnected, setIsConnected] = useState(false);

	useEffect(() => {
		const token = localStorage.getItem("token");
		if (token && !wsManager.isConnected()) {
			wsManager
				.connect(token)
				.then(() => setIsConnected(true))
				.catch(console.error);
		}
	}, []);

	return { wsManager, isConnected };
};
