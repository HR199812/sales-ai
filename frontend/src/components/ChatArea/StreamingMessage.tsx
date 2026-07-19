import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Message } from "../../types/index";
import { ResponseRenderer } from "./ResponseRenderer";
import "./StreamingMessage.css";

interface StreamingMessageProps {
	message: Message;
	userInitial?: string;
}

interface StateConfig {
	label: string;
	icon: string;
	color: string;
}

const STATE_MAP: Record<string, StateConfig> = {
	connecting:    { label: "Connecting...",              icon: "⟳", color: "blue"   },
	agent1:        { label: "Fetching client data...",    icon: "🗄", color: "violet" },
	agent2:        { label: "Fetching product catalog...",icon: "📦", color: "violet" },
	agent3:        { label: "Running compliance checks...",icon:"🛡", color: "amber"  },
	thinking:      { label: "Thinking...",                icon: "✦", color: "purple" },
	mcp_connected: { label: "MCP Connected",              icon: "⚡", color: "green"  },
	mcp_thinking:  { label: "MCP Thinking...",            icon: "✦", color: "green"  },
	calling:       { label: "Calling agent...",           icon: "⟳", color: "blue"   },
	almost_done:   { label: "Almost done...",             icon: "✦", color: "purple" },
};

// Each status badge shows for at least this long so the user can read it
const BADGE_MIN_MS = 650;

export const StreamingMessage: React.FC<StreamingMessageProps> = ({
	message,
	userInitial = "U",
}) => {
	const [displayContent, setDisplayContent] = useState(message.content);
	const [visibleState, setVisibleState] = useState<string | null>(null);
	const [exiting, setExiting] = useState(false);

	// Queue ensures each badge shows for BADGE_MIN_MS even if server sends many fast
	const queueRef   = useRef<Array<string | null>>([]);
	const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
	const exitingRef = useRef(false);

	const advance = useCallback(() => {
		timerRef.current = null;
		if (queueRef.current.length === 0) return;

		const next = queueRef.current.shift()!;

		if (next === null) {
			// Content is flowing — fade out badge immediately
			exitingRef.current = true;
			setExiting(true);
			timerRef.current = setTimeout(() => {
				timerRef.current = null;
				exitingRef.current = false;
				setVisibleState(null);
				setExiting(false);
			}, 280);
		} else {
			exitingRef.current = false;
			setExiting(false);
			setVisibleState(next);
			// Hold this badge, then move to next in queue
			timerRef.current = setTimeout(advance, BADGE_MIN_MS);
		}
	}, []);

	// Receive incoming agentState from the store
	useEffect(() => {
		const incoming = message.agentState;

		if (incoming === null || incoming === undefined) {
			// Real content started — flush queue and trigger exit
			queueRef.current = [null];
			if (timerRef.current) {
				clearTimeout(timerRef.current);
				timerRef.current = null;
			}
			advance();
		} else {
			queueRef.current.push(incoming);
			if (!timerRef.current) advance();
		}
	}, [message.agentState, advance]);

	// Sync content from store
	useEffect(() => {
		setDisplayContent(message.content);
	}, [message.content]);

	// Listen for live stream chunks dispatched as custom events
	useEffect(() => {
		if (!message.isStreaming) return;
		const handleChunk = (e: CustomEvent<{ chunk: string }>) => {
			setDisplayContent((prev) => prev + e.detail.chunk);
		};
		window.addEventListener(`stream:${message.id}`, handleChunk as EventListener);
		return () => window.removeEventListener(`stream:${message.id}`, handleChunk as EventListener);
	}, [message.id, message.isStreaming]);

	// Cleanup timer on unmount
	useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

	const isUser      = message.role === "user";
	const stateConfig = visibleState ? STATE_MAP[visibleState] : null;
	const showBadge   = !isUser && stateConfig && !displayContent;

	return (
		<div className={`message message-${message.role}`}>
			<div className={`msg-avatar ${isUser ? "msg-avatar-user" : "msg-avatar-assistant"}`}>
				{isUser ? userInitial : "⚡"}
			</div>

			<div className={`message-bubble ${isUser ? "" : "message-bubble-assistant"}`}>

				{/* ── Agent status badge ── */}
				{showBadge && (
					<div className={`agent-status-badge agent-status-${stateConfig.color} ${exiting ? "agent-status-exit" : "agent-status-enter"}`}>
						<span className={`agent-status-icon ${visibleState === "connecting" || visibleState === "calling" ? "spin" : "pulse-dot"}`}>
							{stateConfig.icon}
						</span>
						<span className="agent-status-label">{stateConfig.label}</span>
						<span className="agent-status-dots">
							<span /><span /><span />
						</span>
					</div>
				)}

				{/* ── Message content ── */}
				{displayContent && (
					<div className={`message-content ${isUser ? "message-content-user" : "message-content-assistant"}`}>
						{isUser ? (
							<span>{displayContent}</span>
						) : (
							<ResponseRenderer
								content={displayContent}
								isStreaming={message.isStreaming}
							/>
						)}
						{message.isStreaming && <span className="cursor" />}
					</div>
				)}

				{displayContent && (
					<div className="message-time">
						{new Date(message.timestamp).toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
						})}
					</div>
				)}
			</div>
		</div>
	);
};
