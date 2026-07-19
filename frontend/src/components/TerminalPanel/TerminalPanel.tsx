import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { Terminal } from "@xterm/xterm";
import type React from "react";
import { useCallback, useEffect, useRef } from "react";
import "@xterm/xterm/css/xterm.css";
import "./TerminalPanel.css";

interface TerminalPanelProps {
	isOpen: boolean;
	height: number;
	onHeightChange: (h: number) => void;
	onClose: () => void;
}

const TERMINAL_WS = "ws://localhost:3001";
const MIN_HEIGHT = 120;
const MAX_HEIGHT_RATIO = 0.8;

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
	isOpen,
	height,
	onHeightChange,
	onClose,
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const termRef = useRef<Terminal | null>(null);
	const fitAddonRef = useRef<FitAddon | null>(null);
	const wsRef = useRef<WebSocket | null>(null);
	const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const initializedRef = useRef(false);

	// Lazy-init terminal on first open
	useEffect(() => {
		if (!isOpen || initializedRef.current || !containerRef.current) return;
		initializedRef.current = true;

		const term = new Terminal({
			theme: {
				background: "#0d1117",
				foreground: "#c9d1d9",
				cursor: "#58a6ff",
				selectionBackground: "#264f78",
				black: "#484f58",
				red: "#ff7b72",
				green: "#3fb950",
				yellow: "#d29922",
				blue: "#58a6ff",
				magenta: "#bc8cff",
				cyan: "#39c5cf",
				white: "#b1bac4",
				brightBlack: "#6e7681",
				brightRed: "#ffa198",
				brightGreen: "#56d364",
				brightYellow: "#e3b341",
				brightBlue: "#79c0ff",
				brightMagenta: "#d2a8ff",
				brightCyan: "#56d4dd",
				brightWhite: "#f0f6fc",
			},
			fontFamily: '"Menlo", "Monaco", "Courier New", monospace',
			fontSize: 14,
			lineHeight: 1.4,
			cursorBlink: true,
			cursorStyle: "block",
			scrollback: 5000,
			allowTransparency: false,
		});

		const fitAddon = new FitAddon();
		const webLinksAddon = new WebLinksAddon();
		term.loadAddon(fitAddon);
		term.loadAddon(webLinksAddon);
		term.open(containerRef.current);
		termRef.current = term;
		fitAddonRef.current = fitAddon;

		setTimeout(() => fitAddon.fit(), 50);

		const connect = () => {
			const ws = new WebSocket(TERMINAL_WS);
			wsRef.current = ws;

			ws.onopen = () => {
				fitAddon.fit();
				ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
			};

			ws.onmessage = (e) => {
				term.write(typeof e.data === "string" ? e.data : new Uint8Array(e.data));
			};

			ws.onclose = () => {
				term.writeln("\r\n\x1b[33m[disconnected — reconnecting...]\x1b[0m");
				reconnectTimerRef.current = setTimeout(connect, 2000);
			};

			ws.onerror = () => {
				term.writeln("\r\n\x1b[31m[terminal server not reachable on ws://localhost:3001]\x1b[0m");
				term.writeln("\x1b[90mRun: cd terminal-server && npm install && npm start\x1b[0m\r\n");
			};
		};

		term.onData((data) => {
			if (wsRef.current?.readyState === WebSocket.OPEN) {
				wsRef.current.send(JSON.stringify({ type: "input", data }));
			}
		});

		connect();
	}, [isOpen]);

	// Fit when height changes or panel opens
	useEffect(() => {
		if (!isOpen || !fitAddonRef.current) return;
		const timer = setTimeout(() => {
			fitAddonRef.current?.fit();
			const term = termRef.current;
			const ws = wsRef.current;
			if (ws?.readyState === WebSocket.OPEN && term) {
				ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
			}
		}, 30);
		return () => clearTimeout(timer);
	}, [isOpen, height]);

	// Global window resize
	useEffect(() => {
		const handleResize = () => {
			if (isOpen) fitAddonRef.current?.fit();
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [isOpen]);

	// Cleanup on unmount
	useEffect(
		() => () => {
			if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
			wsRef.current?.close();
			termRef.current?.dispose();
		},
		[],
	);

	const handleDragStart = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			const startY = e.clientY;
			const startHeight = height;

			const onMouseMove = (ev: MouseEvent) => {
				const delta = startY - ev.clientY;
				const newHeight = Math.min(
					Math.max(MIN_HEIGHT, startHeight + delta),
					window.innerHeight * MAX_HEIGHT_RATIO,
				);
				onHeightChange(newHeight);
			};

			const onMouseUp = () => {
				document.removeEventListener("mousemove", onMouseMove);
				document.removeEventListener("mouseup", onMouseUp);
			};

			document.addEventListener("mousemove", onMouseMove);
			document.addEventListener("mouseup", onMouseUp);
		},
		[height, onHeightChange],
	);

	return (
		<div className="terminal-panel" style={{ height: isOpen ? height : 0 }}>
			{/* Drag-to-resize handle */}
			<div className="terminal-panel-resizer" onMouseDown={handleDragStart} />

			{/* Header bar */}
			<div className="terminal-panel-header">
				<div className="terminal-panel-title">
					<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
						<path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
					Terminal
				</div>
				<div className="terminal-panel-actions">
					<span className="terminal-panel-hint">
						Type <code>claude</code> to start an AI session
					</span>
					<button className="terminal-panel-close" onClick={onClose} title="Close terminal">
						<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
							<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>

			{/* xterm container */}
			<div className="terminal-panel-body" ref={containerRef} />
		</div>
	);
};
