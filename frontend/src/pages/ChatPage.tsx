import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageInput } from "../components/ChatArea/MessageInput";
import { StreamingMessage } from "../components/ChatArea/StreamingMessage";
import { useAuthStore } from "../stores/authStore";
import { useChatStore } from "../stores/chatStore";
import "./ChatPage.css";

const SUGGESTIONS = [
	"Draft a cold outreach email",
	"Analyze my sales pipeline",
	"Write a proposal template",
	"Coach me on objection handling",
];

const ChatPage: React.FC = () => {
	const { user, token, isAuthenticated, logout } = useAuthStore();
	const {
		sessions,
		currentSessionId,
		fetchSessions,
		createSession,
		deleteSession,
		setCurrentSession,
	} = useChatStore();
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [welcomeInput, setWelcomeInput] = useState("");
	const [autoMessage, setAutoMessage] = useState<string | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const welcomeInputRef = useRef<HTMLInputElement>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const navigate = useNavigate();

	useEffect(() => {
		if (!isAuthenticated || !token) {
			navigate("/login");
			return;
		}
		fetchSessions(token).catch(console.error);
	}, [isAuthenticated, token]);

	const currentSession = sessions.find((s) => s.id === currentSessionId);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [currentSession?.messages?.length]);

	const handleWelcomeSubmit = async (message: string) => {
		const text = message.trim();
		if (!text || isCreating) return;
		setIsCreating(true);
		try {
			setAutoMessage(text);
			await createSession(text.length > 60 ? text.slice(0, 57) + "..." : text);
			setWelcomeInput("");
		} catch {
			setAutoMessage(null);
		} finally {
			setIsCreating(false);
		}
	};

	const handleNewChat = () => {
		setCurrentSession(null);
		setWelcomeInput("");
		setAutoMessage(null);
	};

	const handleLogout = () => {
		logout();
		navigate("/login");
	};

	const userInitial = user?.email?.[0]?.toUpperCase() ?? "U";

	return (
		<div className="chat-layout">
			{/* ── Sidebar ── */}
			<aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
				{/* Logo + compose */}
				<div className="sidebar-top">
					<div className="sidebar-logo-area">
						<div className="sidebar-logo-icon">⚡</div>
						<span className="sidebar-logo-text">Sales AI</span>
					</div>
					<button
						className="compose-btn"
						onClick={handleNewChat}
						title="New chat"
					>
						<svg
							width="18"
							height="18"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth="2"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M12 4v16m8-8H4"
							/>
						</svg>
					</button>
				</div>

				{/* Nav */}
				<nav className="sidebar-nav">
					<button className="nav-item" onClick={handleNewChat}>
						<svg
							width="16"
							height="16"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth="2"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
							/>
						</svg>
						New chat
					</button>
				</nav>

				<div className="sidebar-divider" />

				{/* Recent chats */}
				<div className="sessions-section">
					{sessions.length > 0 && <div className="sessions-label">Recent</div>}
					{sessions.length === 0 && (
						<p className="empty-sessions">
							No conversations yet.
							<br />
							Start a new chat above.
						</p>
					)}
					{sessions.map((session) => (
						<div
							key={session.id}
							className={`session-item ${session.id === currentSessionId ? "active" : ""}`}
							onClick={() => setCurrentSession(session.id)}
						>
							<span className="session-title">{session.title}</span>
							<button
								className="delete-session-btn"
								onClick={(e) => {
									e.stopPropagation();
									deleteSession(session.id);
								}}
								title="Delete"
							>
								×
							</button>
						</div>
					))}
				</div>

				{/* Bottom: terminal + user */}
				<div className="sidebar-bottom">
					<Link to="/terminal" className="terminal-nav-item">
						<svg
							width="16"
							height="16"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth="2"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
						Terminal
					</Link>
					<button
						className="sidebar-user-btn"
						onClick={handleLogout}
						title="Sign out"
					>
						<div className="user-avatar">{userInitial}</div>
						<span className="user-email-text">{user?.email ?? "Account"}</span>
					</button>
				</div>
			</aside>

			{/* ── Main ── */}
			<main className="chat-main">
				{currentSession ? (
					<>
						<div className="chat-header">
							<button
								className="sidebar-toggle"
								onClick={() => setSidebarOpen(!sidebarOpen)}
							>
								☰
							</button>
							<h2 className="chat-title">{currentSession.title}</h2>
						</div>

						<div className="messages-area">
							{(currentSession.messages ?? []).length === 0 && (
								<div className="empty-chat">Send a message to begin</div>
							)}
							{(currentSession.messages ?? []).map((message) => (
								<StreamingMessage
									key={message.id}
									message={message}
									userInitial={userInitial}
								/>
							))}
							<div ref={messagesEndRef} />
						</div>

						<MessageInput
							sessionId={currentSession.id}
							autoMessage={autoMessage}
							onAutoMessageSent={() => setAutoMessage(null)}
						/>
					</>
				) : (
					<div className="welcome-screen">
						<button
							className="welcome-toggle"
							onClick={() => setSidebarOpen(!sidebarOpen)}
						>
							☰
						</button>

						<div className="welcome-content">
							<h1 className="welcome-heading">
								What can I help
								<br />
								you with today?
							</h1>

							<div className="welcome-input-wrap">
								<form
									onSubmit={(e) => {
										e.preventDefault();
										handleWelcomeSubmit(welcomeInput);
									}}
								>
									<div className="welcome-input-box">
										<input
											ref={welcomeInputRef}
											className="welcome-input"
											placeholder="Ask anything about sales..."
											value={welcomeInput}
											onChange={(e) => setWelcomeInput(e.target.value)}
											disabled={isCreating}
											autoFocus
										/>
										<div className="welcome-input-bar">
											<div className="model-pill">
												<span className="model-pill-dot" />
												Model: Ai-of-my-owm
											</div>
											<button
												type="submit"
												className="welcome-send-btn"
												disabled={!welcomeInput.trim() || isCreating}
											>
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
											</button>
										</div>
									</div>
								</form>
							</div>

							<div className="suggestion-chips">
								{SUGGESTIONS.map((s) => (
									<button
										key={s}
										className="suggestion-chip"
										onClick={() => handleWelcomeSubmit(s)}
										disabled={isCreating}
									>
										{s}
									</button>
								))}
							</div>
						</div>
					</div>
				)}
			</main>
		</div>
	);
};

export default ChatPage;
