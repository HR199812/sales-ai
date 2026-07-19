import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useChatStore } from "../../stores/chatStore";
import "./MessageInput.css";

const ACCEPTED_TYPES = ".xlsx,.csv,image/*";
const STATUS_PREFIX = "__STATUS__:";

interface MessageInputProps {
	sessionId: string;
	autoMessage?: string | null;
	onAutoMessageSent?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
	sessionId,
	autoMessage,
	onAutoMessageSent,
}) => {
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const {
		addMessage,
		startStreaming,
		appendToMessage,
		stopStreaming,
		setMessageAgentState,
	} = useChatStore();

	const autoGrow = () => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = "auto";
		el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
	};

	const sendMessage = useCallback(
		async (text: string) => {
			const messageText = text.trim();
			if (!messageText || isLoading) return;

			const token = localStorage.getItem("token");
			if (!token) return;

			const userMessageId = crypto.randomUUID();
			const assistantMessageId = crypto.randomUUID();

			addMessage(sessionId, {
				id: userMessageId,
				role: "user",
				content: messageText,
				timestamp: new Date().toISOString(),
			});

			addMessage(sessionId, {
				id: assistantMessageId,
				role: "assistant",
				content: "",
				timestamp: new Date().toISOString(),
				isStreaming: true,
				agentState: "connecting",
			});

			setInput("");
			setAttachedFiles([]);
			if (textareaRef.current) textareaRef.current.style.height = "auto";
			setIsLoading(true);
			startStreaming(sessionId, assistantMessageId);

			try {
				const response = await fetch(
					`/api/chat/sessions/${sessionId}/message`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${token}`,
						},
						body: JSON.stringify({ content: messageText }),
					},
				);

				if (!response.ok || !response.body) {
					throw new Error(`Request failed: ${response.status}`);
				}

				const reader = response.body.getReader();
				const decoder = new TextDecoder();

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					const text = decoder.decode(value, { stream: true });
					for (const line of text.split("\n")) {
						if (line.startsWith("data:")) {
							const chunk = line.slice(5).trim();
							if (!chunk || chunk === "[DONE]") continue;

							if (chunk.startsWith(STATUS_PREFIX)) {
								// Status event — update badge, don't append to content
								const state = chunk.slice(STATUS_PREFIX.length).trim();
								setMessageAgentState(sessionId, assistantMessageId, state);
							} else {
								// Real content — clear status badge, append text
								setMessageAgentState(sessionId, assistantMessageId, null);
								appendToMessage(sessionId, assistantMessageId, chunk);
							}
						}
					}
				}
			} catch (error) {
				console.error("Error sending message:", error);
			} finally {
				stopStreaming(sessionId, assistantMessageId);
				setIsLoading(false);
			}
		},
		[
			sessionId,
			isLoading,
			addMessage,
			startStreaming,
			appendToMessage,
			stopStreaming,
			setMessageAgentState,
		],
	);

	useEffect(() => {
		if (autoMessage) {
			const timer = setTimeout(() => {
				sendMessage(autoMessage);
				onAutoMessageSent?.();
			}, 80);
			return () => clearTimeout(timer);
		}
	}, []);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			sendMessage(input);
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files ?? []);
		setAttachedFiles((prev) => [...prev, ...files]);
		e.target.value = "";
	};

	const removeFile = (index: number) => {
		setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
	};

	return (
		<div className="message-input-area">
			<div className="message-input-box">
				<textarea
					ref={textareaRef}
					className="message-textarea"
					value={input}
					onChange={(e) => {
						setInput(e.target.value);
						autoGrow();
					}}
					onKeyDown={handleKeyDown}
					placeholder="Message Sales AI..."
					disabled={isLoading}
					rows={1}
				/>

				{attachedFiles.length > 0 && (
					<div className="attached-files">
						{attachedFiles.map((file, i) => (
							<div key={i} className="attached-file-chip">
								<span>{file.name}</span>
								<button onClick={() => removeFile(i)}>×</button>
							</div>
						))}
					</div>
				)}

				<div className="input-bottom-bar">
					<div className="input-left-actions">
						<div className="model-pill">
							<span className="model-pill-dot" />
							Model: Markets-Sales-One
						</div>
						<label
							className="attach-btn"
							title="Attach file (xlsx, csv, images)"
						>
							<input
								ref={fileInputRef}
								type="file"
								accept={ACCEPTED_TYPES}
								multiple
								onChange={handleFileChange}
							/>
							<svg
								width="17"
								height="17"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth="2"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
								/>
							</svg>
						</label>
					</div>

					<div className="input-right-actions">
						<button
							className="send-btn"
							onClick={() => sendMessage(input)}
							disabled={!input.trim() || isLoading}
							title="Send (Enter)"
						>
							{isLoading ? (
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2.5"
								>
									<path
										strokeLinecap="round"
										d="M12 4v4m0 8v4M4 12h4m8 0h4"
									/>
								</svg>
							) : (
								<svg
									width="16"
									height="16"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth="2.5"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M5 12h14M12 5l7 7-7 7"
									/>
								</svg>
							)}
						</button>
					</div>
				</div>
			</div>
			<p className="input-hint">Enter to send · Shift+Enter for new line</p>
		</div>
	);
};
