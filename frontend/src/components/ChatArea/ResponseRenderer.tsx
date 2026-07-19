import type React from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import "./ResponseRenderer.css";

interface ResponseRendererProps {
	content: string;
	isStreaming?: boolean;
}

// ── Type detection ────────────────────────────────────────────────────────────

type RenderMode = "compliance" | "questionnaire" | "table" | "prose";

function detectMode(content: string): RenderMode {
	if (/##\s*recommendation/i.test(content)) return "compliance";
	if (/\bq\d+[.:]/i.test(content) && content.includes("?")) return "questionnaire";
	if (/^\|.+\|\s*\n\|[-: |]+\|/m.test(content)) return "table";
	return "prose";
}

// ── Compliance status config ──────────────────────────────────────────────────

interface StatusCfg {
	icon: string;
	label: string;
	accentColor: string;
	badgeBg: string;
	badgeColor: string;
}

const STATUS_CFG: Record<string, StatusCfg> = {
	PROCEED: {
		icon: "✓",
		label: "Cleared to Proceed",
		accentColor: "#16a34a",
		badgeBg: "#dcfce7",
		badgeColor: "#15803d",
	},
	DO_NOT_PROCEED: {
		icon: "✗",
		label: "Do Not Proceed",
		accentColor: "#dc2626",
		badgeBg: "#fee2e2",
		badgeColor: "#b91c1c",
	},
	PROCEED_WITH_CONDITIONS: {
		icon: "⚠",
		label: "Proceed With Conditions",
		accentColor: "#d97706",
		badgeBg: "#fef3c7",
		badgeColor: "#b45309",
	},
	NEEDS_CLARIFICATION: {
		icon: "?",
		label: "Needs Clarification",
		accentColor: "#2563eb",
		badgeBg: "#eff6ff",
		badgeColor: "#1d4ed8",
	},
};

function resolveStatus(content: string): StatusCfg | null {
	const match = content.match(
		/##\s*recommendation[:\s]+\[?(PROCEED_WITH_CONDITIONS|DO_NOT_PROCEED|NEEDS_CLARIFICATION|PROCEED)\]?/i,
	);
	if (!match) return null;
	const key = match[1].toUpperCase();
	return STATUS_CFG[key] ?? null;
}

// ── Shared markdown components ────────────────────────────────────────────────

const BADGE_MAP: Record<string, string> = {
	PASS: "rr-badge rr-badge-pass",
	FAIL: "rr-badge rr-badge-fail",
	PROCEED: "rr-badge rr-badge-proceed",
	DO_NOT_PROCEED: "rr-badge rr-badge-fail",
	PROCEED_WITH_CONDITIONS: "rr-badge rr-badge-warn",
	NEEDS_CLARIFICATION: "rr-badge rr-badge-info",
	WARNING: "rr-badge rr-badge-warn",
	"N/A": "rr-badge rr-badge-muted",
};

const mdComponents: Components = {
	strong({ children }) {
		const text = String(children);
		const cls = BADGE_MAP[text];
		if (cls) return <span className={cls}>{text.replace(/_/g, " ")}</span>;
		return <strong>{children}</strong>;
	},
	table({ children }) {
		return (
			<div className="rr-table-wrap">
				<table className="rr-table">{children}</table>
			</div>
		);
	},
	th({ children }) {
		return <th className="rr-th">{children}</th>;
	},
	td({ children }) {
		return <td className="rr-td">{children}</td>;
	},
	h1({ children }) {
		return <h1 className="rr-h1">{children}</h1>;
	},
	h2({ children }) {
		return <h2 className="rr-h2">{children}</h2>;
	},
	h3({ children }) {
		return <h3 className="rr-h3">{children}</h3>;
	},
	hr() {
		return <hr className="rr-hr" />;
	},
	blockquote({ children }) {
		return <blockquote className="rr-blockquote">{children}</blockquote>;
	},
	code({ children, className }) {
		if (className?.startsWith("language-")) {
			return (
				<pre className="rr-pre">
					<code>{children}</code>
				</pre>
			);
		}
		return <code className="rr-code">{children}</code>;
	},
};

// ── Renderers ─────────────────────────────────────────────────────────────────

function Md({ children }: { children: string }) {
	return (
		<ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
			{children}
		</ReactMarkdown>
	);
}

function ComplianceRenderer({ content }: { content: string }) {
	const cfg = resolveStatus(content);

	// Strip the first ## Recommendation line — we display it as the header card
	const body = content.replace(/^##\s*recommendation[^\n]*/im, "").trim();

	return (
		<div className="rr-compliance">
			{cfg && (
				<div
					className="rr-compliance-header"
					style={{ borderLeftColor: cfg.accentColor }}
				>
					<span
						className="rr-compliance-icon"
						style={{ background: cfg.badgeBg, color: cfg.badgeColor }}
					>
						{cfg.icon}
					</span>
					<span className="rr-compliance-label" style={{ color: cfg.accentColor }}>
						{cfg.label}
					</span>
				</div>
			)}
			<div className="rr-compliance-body">
				<Md>{body}</Md>
			</div>
		</div>
	);
}

function QuestionnaireRenderer({ content }: { content: string }) {
	// Split out intro prose (before first Qn) and questions
	const qPattern = /(?=\bQ\d+[.:])/;
	const parts = content.split(qPattern);
	const intro = parts[0].trim();
	const questionBlocks = parts.slice(1);

	// Parse each question block: first line = question, rest = sub-bullets
	const questions = questionBlocks.map((block) => {
		const lines = block.trim().split("\n");
		const first = lines[0].replace(/^\s*Q\d+[.:]\s*/, "").trim();
		const rest = lines.slice(1).join("\n").trim();
		return { question: first, detail: rest };
	});

	return (
		<div className="rr-questionnaire">
			{intro && (
				<div className="rr-q-intro">
					<Md>{intro}</Md>
				</div>
			)}
			<div className="rr-q-list">
				{questions.map((q, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: stable order
					<div key={i} className="rr-q-card">
						<div className="rr-q-number">Q{i + 1}</div>
						<div className="rr-q-body">
							<p className="rr-q-text">{q.question}</p>
							{q.detail && (
								<div className="rr-q-detail">
									<Md>{q.detail}</Md>
								</div>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function TableRenderer({ content }: { content: string }) {
	// Prose before the table, table itself, prose after
	return (
		<div className="rr-table-mode">
			<Md>{content}</Md>
		</div>
	);
}

function ProseRenderer({ content }: { content: string }) {
	return (
		<div className="rr-prose">
			<Md>{content}</Md>
		</div>
	);
}

// ── Main export ───────────────────────────────────────────────────────────────

export const ResponseRenderer: React.FC<ResponseRendererProps> = ({
	content,
	isStreaming,
}) => {
	// During streaming stay in prose until enough content to detect type
	const mode = isStreaming && content.length < 120 ? "prose" : detectMode(content);

	switch (mode) {
		case "compliance":
			return <ComplianceRenderer content={content} />;
		case "questionnaire":
			return <QuestionnaireRenderer content={content} />;
		case "table":
			return <TableRenderer content={content} />;
		default:
			return <ProseRenderer content={content} />;
	}
};
