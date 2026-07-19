import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MessageAttachment } from "../../types/index";
import { useChatStore } from "../../stores/chatStore";
import "./MessageInput.css";

const STATUS_PREFIX = "__STATUS__:";

interface AttachedFile {
	id: string;
	file: File;
	previewUrl: string | null;
}

interface MessageInputProps {
	sessionId: string;
	autoMessage?: string | null;
	onAutoMessageSent?: () => void;
}

const formatSize = (bytes: number): string => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const toDataUrl = (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});

export const MessageInput: React.FC<MessageInputProps> = ({
	sessionId,
	autoMessage,
	onAutoMessageSent,
}) => {
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
	const [attachPopupOpen, setAttachPopupOpen] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [isListening, setIsListening] = useState(false);

	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const imageInputRef = useRef<HTMLInputElement>(null);
	const popupRef = useRef<HTMLDivElement>(null);
	const attachBtnRef = useRef<HTMLButtonElement>(null);
	const dragCounterRef = useRef(0);
	// biome-ignore lint/suspicious/noExplicitAny: SpeechRecognition not in all TS lib targets
	const recognitionRef = useRef<any>(null);

	const {
		addMessage,
		startStreaming,
		appendToMessage,
		stopStreaming,
		setMessageAgentState,
		getCurrentSession,
	} = useChatStore();

	// Close popup on outside click
	useEffect(() => {
		if (!attachPopupOpen) return;
		const onMouseDown = (e: MouseEvent) => {
			if (
				popupRef.current?.contains(e.target as Node) ||
				attachBtnRef.current?.contains(e.target as Node)
			)
				return;
			setAttachPopupOpen(false);
		};
		document.addEventListener("mousedown", onMouseDown);
		return () => document.removeEventListener("mousedown", onMouseDown);
	}, [attachPopupOpen]);

	// Revoke preview URLs on unmount
	useEffect(
		() => () => {
			for (const item of attachedFiles) {
				if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
			}
		},
		[],
	);

	const addFiles = useCallback((files: File[]) => {
		const items: AttachedFile[] = files.map((file) => ({
			id: crypto.randomUUID(),
			file,
			previewUrl: file.type.startsWith("image/")
				? URL.createObjectURL(file)
				: null,
		}));
		setAttachedFiles((prev) => [...prev, ...items]);
	}, []);

	const removeFile = useCallback((id: string) => {
		setAttachedFiles((prev) => {
			const item = prev.find((f) => f.id === id);
			if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
			return prev.filter((f) => f.id !== id);
		});
	}, []);

	const toggleListening = useCallback(() => {
		if (isListening) {
			recognitionRef.current?.stop();
			setIsListening(false);
			return;
		}

		// biome-ignore lint/suspicious/noExplicitAny: vendor-prefixed API
		const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
		if (!SpeechRecognitionAPI) {
			alert("Speech recognition is not supported in this browser. Try Chrome or Edge.");
			return;
		}

		const recognition = new SpeechRecognitionAPI();
		recognition.continuous = false;
		recognition.interimResults = true;
		recognition.lang = "en-US";

		recognition.onstart = () => setIsListening(true);
		recognition.onend = () => setIsListening(false);
		recognition.onerror = () => setIsListening(false);

		recognition.onresult = (event: { results: SpeechRecognitionResultList }) => {
			const transcript = Array.from(event.results)
				.map((r) => r[0].transcript)
				.join("");
			setInput(transcript);
			setTimeout(() => {
				const el = textareaRef.current;
				if (el) {
					el.style.height = "auto";
					el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
				}
			}, 0);
		};

		recognitionRef.current = recognition;
		recognition.start();
	}, [isListening]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		addFiles(Array.from(e.target.files ?? []));
		e.target.value = "";
	};

	// Drag & drop handlers on the input box
	const handleDragEnter = (e: React.DragEvent) => {
		e.preventDefault();
		dragCounterRef.current += 1;
		if (dragCounterRef.current === 1) setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		dragCounterRef.current -= 1;
		if (dragCounterRef.current === 0) setIsDragging(false);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		dragCounterRef.current = 0;
		setIsDragging(false);
		const files = Array.from(e.dataTransfer.files);
		if (files.length > 0) addFiles(files);
	};

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

			const userMessageId = crypto.randomUUID();
			const assistantMessageId = crypto.randomUUID();

			// Convert attached files — images + CSVs get data URLs (for display + backend)
			const attachments: MessageAttachment[] = await Promise.all(
				attachedFiles.map(async (item) => {
					const needsData =
						item.file.type.startsWith("image/") ||
						item.file.type === "text/csv" ||
						item.file.name.toLowerCase().endsWith(".csv");
					return {
						name: item.file.name,
						size: item.file.size,
						mimeType: item.file.type || (item.file.name.endsWith(".csv") ? "text/csv" : "application/octet-stream"),
						dataUrl: needsData ? await toDataUrl(item.file) : undefined,
					};
				}),
			);

			addMessage(sessionId, {
				id: userMessageId,
				role: "user",
				content: messageText,
				timestamp: new Date().toISOString(),
				attachments: attachments.length > 0 ? attachments : undefined,
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
			// Revoke preview URLs and clear
			for (const item of attachedFiles) {
				if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
			}
			setAttachedFiles([]);
			if (textareaRef.current) textareaRef.current.style.height = "auto";
			setIsLoading(true);
			startStreaming(sessionId, assistantMessageId);

			// Declared outside try so finally can access it
			let streamedContent = "";

			try {
				const session = getCurrentSession();
				const context = (session?.messages ?? [])
					.filter((m) => !m.isStreaming && m.content && m.id !== userMessageId)
					.slice(-12)
					.map((m) => ({ role: m.role, content: m.content }));

				// Build API attachment list — strip "data:mime;base64," prefix
				const apiAttachments = attachments.map((att) => ({
					name: att.name,
					mimeType: att.mimeType,
					data: att.dataUrl ? att.dataUrl.split(",")[1] : null,
				}));

				const response = await fetch(
					`/api/chat/sessions/${sessionId}/message`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							...(token ? { Authorization: `Bearer ${token}` } : {}),
						},
						body: JSON.stringify({
							content: messageText,
							context,
							attachments: apiAttachments.length > 0 ? apiAttachments : undefined,
						}),
					},
				);

				if (!response.ok || !response.body) {
					throw new Error(`Request failed: ${response.status}`);
				}

				const reader = response.body.getReader();
				const decoder = new TextDecoder();
				let sseBuffer = "";
				let agentStateCleared = false;

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					sseBuffer += decoder.decode(value, { stream: true });

					// SSE events are delimited by blank lines (\n\n)
					const events = sseBuffer.split("\n\n");
					sseBuffer = events.pop() ?? "";

					for (const rawEvent of events) {
						// Rejoin multi-line data: fields with \n (SSE spec §9.2.6)
						const data = rawEvent
							.split("\n")
							.filter((l) => l.startsWith("data:"))
							.map((l) => l.replace(/^data:\s?/, ""))
							.join("\n");

						if (!data || data === "[DONE]") continue;

						if (data.startsWith(STATUS_PREFIX)) {
							agentStateCleared = false;
							setMessageAgentState(
								sessionId,
								assistantMessageId,
								data.slice(STATUS_PREFIX.length).trim(),
							);
						} else {
							// Clear the status badge once (not on every chunk)
							if (!agentStateCleared) {
								setMessageAgentState(sessionId, assistantMessageId, null);
								agentStateCleared = true;
							}
							streamedContent += data;
							// Fire a lightweight custom event — StreamingMessage listens to this
							// to update its local display without touching Zustand/localStorage
							window.dispatchEvent(
								new CustomEvent(`stream:${assistantMessageId}`, {
									detail: { chunk: data },
								}),
							);
						}
					}
				}
			} catch (error) {
				console.error("Error sending message:", error);
			} finally {
				// Persist the full accumulated content to the store exactly once
				if (streamedContent) {
					appendToMessage(sessionId, assistantMessageId, streamedContent);
				}
				stopStreaming(sessionId, assistantMessageId);
				setIsLoading(false);
			}
		},
		[
			sessionId,
			isLoading,
			attachedFiles,
			addMessage,
			startStreaming,
			appendToMessage,
			stopStreaming,
			setMessageAgentState,
			getCurrentSession,
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
			e.preventDefault(); // always suppress newline on bare Enter
			if (!isLoading) sendMessage(input);
		}
	};

	return (
		<div className="message-input-area">
			<div
				className={`message-input-box${isDragging ? " drag-over" : ""}`}
				onDragEnter={handleDragEnter}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
			>
				{/* Drag-and-drop overlay */}
				{isDragging && (
					<div className="drop-overlay">
						<svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
							<path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
						</svg>
						<span>Drop files to attach</span>
					</div>
				)}

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
					rows={1}
				/>

				{/* File preview chips */}
				{attachedFiles.length > 0 && (
					<div className="attached-files">
						{attachedFiles.map((item) => (
							<div key={item.id} className="attached-file-chip">
								{item.previewUrl ? (
									<img
										className="chip-thumb"
										src={item.previewUrl}
										alt={item.file.name}
									/>
								) : (
									<div className="chip-icon">
										<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
											<path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
										</svg>
									</div>
								)}
								<div className="chip-info">
									<span className="chip-name">{item.file.name}</span>
									<span className="chip-size">{formatSize(item.file.size)}</span>
								</div>
								<button
									className="chip-remove"
									onClick={() => removeFile(item.id)}
									title="Remove"
								>
									<svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
										<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
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

						{/* Hidden file inputs */}
						<input
							ref={fileInputRef}
							type="file"
							accept=".xlsx,.csv"
							multiple
							style={{ display: "none" }}
							onChange={handleFileChange}
						/>
						<input
							ref={imageInputRef}
							type="file"
							accept="image/*"
							multiple
							style={{ display: "none" }}
							onChange={handleFileChange}
						/>

						{/* Attach button + popup */}
						<div className="attach-btn-wrapper">
							<button
								ref={attachBtnRef}
								className={`attach-btn${attachPopupOpen ? " active" : ""}`}
								onClick={() => setAttachPopupOpen((o) => !o)}
								title="Attach files or images"
							>
								<svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
									<path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
								</svg>
							</button>

							{attachPopupOpen && (
								<div className="attach-popup" ref={popupRef}>
									<button
										className="attach-popup-option"
										onClick={() => {
											fileInputRef.current?.click();
											setAttachPopupOpen(false);
										}}
									>
										<div className="attach-popup-icon attach-popup-icon-file">
											<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
												<path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
											</svg>
										</div>
										<div className="attach-popup-text">
											<span className="attach-popup-label">Files</span>
											<span className="attach-popup-hint">Excel or CSV spreadsheets</span>
										</div>
									</button>

									<button
										className="attach-popup-option"
										onClick={() => {
											imageInputRef.current?.click();
											setAttachPopupOpen(false);
										}}
									>
										<div className="attach-popup-icon attach-popup-icon-image">
											<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
												<path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
											</svg>
										</div>
										<div className="attach-popup-text">
											<span className="attach-popup-label">Images</span>
											<span className="attach-popup-hint">PNG, JPG, GIF, WebP</span>
										</div>
									</button>

									<div className="attach-popup-divider" />

									<p className="attach-popup-drop-hint">
										or drag &amp; drop directly into the input
									</p>
								</div>
							)}
						</div>
					</div>

					<div className="input-right-actions">
						<button
							className={`mic-btn${isListening ? " listening" : ""}`}
							onClick={toggleListening}
							title={isListening ? "Stop recording" : "Speak to type"}
							type="button"
						>
							{isListening ? (
								<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
									<rect x="6" y="6" width="12" height="12" rx="2" />
								</svg>
							) : (
								<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
									<path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 3a4 4 0 014 4v4a4 4 0 01-8 0V7a4 4 0 014-4z" />
								</svg>
							)}
						</button>

						<button
							className="send-btn"
							onClick={() => sendMessage(input)}
							disabled={!input.trim() || isLoading}
							title="Send (Enter)"
						>
							{isLoading ? (
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
									<path strokeLinecap="round" d="M12 4v4m0 8v4M4 12h4m8 0h4" />
								</svg>
							) : (
								<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
									<path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
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
