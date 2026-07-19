import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { Terminal } from "@xterm/xterm";
import type React from "react";
import { useEffect, useRef } from "react";
import "@xterm/xterm/css/xterm.css";
import "./TerminalPage.css";

const TERMINAL_WS = "ws://localhost:3001";

const TerminalPage: React.FC = () => {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!containerRef.current) return;

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

		let ws: WebSocket | null = null;
		let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

		const connect = () => {
			ws = new WebSocket(TERMINAL_WS);

			ws.onopen = () => {
				fitAddon.fit();
				ws!.send(
					JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }),
				);
			};

			ws.onmessage = (e) => {
				term.write(
					typeof e.data === "string" ? e.data : new Uint8Array(e.data),
				);
			};

			ws.onclose = () => {
				term.writeln("\r\n\x1b[33m[disconnected — reconnecting...]\x1b[0m");
				reconnectTimer = setTimeout(connect, 2000);
			};

			ws.onerror = () => {
				term.writeln(
					"\r\n\x1b[31m[terminal server not reachable on ws://localhost:3001]\x1b[0m",
				);
				term.writeln(
					"\x1b[90mRun: cd terminal-server && npm install && npm start\x1b[0m\r\n",
				);
			};
		};

		term.onData((data) => {
			if (ws?.readyState === WebSocket.OPEN) {
				ws.send(JSON.stringify({ type: "input", data }));
			}
		});

		const handleResize = () => {
			fitAddon.fit();
			if (ws?.readyState === WebSocket.OPEN) {
				ws.send(
					JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }),
				);
			}
		};

		window.addEventListener("resize", handleResize);
		connect();

		return () => {
			window.removeEventListener("resize", handleResize);
			if (reconnectTimer) clearTimeout(reconnectTimer);
			ws?.close();
			term.dispose();
		};
	}, []);

	return (
		<div className="terminal-page">
			<div className="terminal-header">
				<span className="terminal-title">Terminal</span>
				<span className="terminal-hint">
					Type <code>claude</code> to start an AI session
				</span>
			</div>
			<div className="terminal-container" ref={containerRef} />
		</div>
	);
};

export default TerminalPage;
