package com.salesai.service;

import com.salesai.dto.ValidationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.scheduler.Schedulers;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClaudeService {

    private final QueryValidationService queryValidationService;

    public Flux<String> streamClaude(
            String userMessage,
            List<Map<String, String>> context,
            List<Map<String, String>> attachments) {

        return Flux.<String>create(sink -> {
            List<Path> tempFiles = new ArrayList<>();
            try {
                sink.next("__STATUS__:connecting");

                sink.next("__STATUS__:analyzing");
                ValidationResult validation = queryValidationService.validate(userMessage, context);

                if (!validation.isProceed()) {
                    log.info("Query validation requires clarification: {} question(s)", validation.getQuestions().size());
                    sink.next(buildClarificationResponse(validation.getQuestions()));
                    sink.complete();
                    return;
                }

                String prompt = buildPrompt(userMessage, context, attachments);
                List<String> command = buildCommand(prompt, attachments, tempFiles);

                ProcessBuilder pb = new ProcessBuilder(command);
                pb.redirectErrorStream(false);
                Process process = pb.start();

                sink.next("__STATUS__:thinking");

                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(process.getInputStream()))) {
                    char[] buf = new char[128];
                    int n;
                    while ((n = reader.read(buf, 0, buf.length)) != -1) {
                        sink.next(new String(buf, 0, n));
                    }
                }

                int exitCode = process.waitFor();
                if (exitCode != 0) {
                    try (BufferedReader err = new BufferedReader(
                            new InputStreamReader(process.getErrorStream()))) {
                        String errMsg = err.lines().reduce("", (a, b) -> a + "\n" + b).trim();
                        log.error("claude CLI exited with code {}: {}", exitCode, errMsg);
                        sink.error(new RuntimeException("claude CLI error: " + errMsg));
                        return;
                    }
                }

                sink.next("__STATUS__:almost_done");
                sink.complete();

            } catch (Exception e) {
                log.error("Failed to run claude CLI", e);
                sink.error(e);
            } finally {
                for (Path p : tempFiles) {
                    try { Files.deleteIfExists(p); } catch (Exception ignored) {}
                }
            }
        }).subscribeOn(Schedulers.boundedElastic());
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /** Build the ProcessBuilder command, writing image attachments to temp files. */
    private List<String> buildCommand(
            String prompt,
            List<Map<String, String>> attachments,
            List<Path> tempFiles) throws Exception {

        List<String> cmd = new ArrayList<>(List.of("claude", "-p", prompt));

        if (attachments == null) return cmd;

        for (Map<String, String> att : attachments) {
            String mimeType = att.getOrDefault("mimeType", "");
            String data = att.get("data");
            if (mimeType.startsWith("image/") && data != null && !data.isBlank()) {
                String ext = mimeTypeToExt(mimeType);
                Path tmp = Files.createTempFile("salesai_img_", "." + ext);
                Files.write(tmp, Base64.getDecoder().decode(data));
                tempFiles.add(tmp);
                cmd.add("--image");
                cmd.add(tmp.toString());
                log.debug("Attached image temp file: {}", tmp);
            }
        }

        return cmd;
    }

    /** Returns true for assistant replies that look like they were truncated mid-list. */
    private boolean isTruncatedListEntry(String content) {
        // Matches things like "Here are your colleagues:8. Surbhi" or "list of everyone:. Piyush"
        return content.matches(".*:\\d*\\.\\s+\\S+$") && !content.contains("\n");
    }

    private String mimeTypeToExt(String mimeType) {
        return switch (mimeType) {
            case "image/jpeg" -> "jpg";
            case "image/png"  -> "png";
            case "image/gif"  -> "gif";
            case "image/webp" -> "webp";
            default           -> "png";
        };
    }

    private String buildClarificationResponse(List<String> questions) {
        StringBuilder sb = new StringBuilder();
        sb.append("To provide an accurate analysis, I need a few more details:\n\n");
        for (int i = 0; i < questions.size(); i++) {
            sb.append("Q").append(i + 1).append(". ").append(questions.get(i)).append("\n\n");
        }
        sb.append("Once you provide these details, I can run the full compliance and suitability checks.");
        return sb.toString();
    }

    private String buildPrompt(
            String userMessage,
            List<Map<String, String>> context,
            List<Map<String, String>> attachments) {

        StringBuilder sb = new StringBuilder();
        sb.append("You are a helpful AI assistant for sales professionals at a financial institution.\n\n");

        if (context != null && !context.isEmpty()) {
            sb.append("Conversation history:\n\n");
            for (Map<String, String> msg : context) {
                String role = "user".equals(msg.get("role")) ? "User" : "Assistant";
                String content = msg.getOrDefault("content", "").trim();
                // Skip assistant messages that look truncated (very short or end with a lone
                // list-item fragment like ":8. Surbhi") to avoid poisoning Claude's context.
                if ("Assistant".equals(role) && (content.length() < 10 || isTruncatedListEntry(content))) {
                    continue;
                }
                sb.append(role).append(": ").append(content).append("\n\n");
            }
        }

        // Inline CSV content; mention other non-image files by name
        if (attachments != null && !attachments.isEmpty()) {
            boolean hasFileContext = false;
            StringBuilder fileCtx = new StringBuilder();

            for (Map<String, String> att : attachments) {
                String mimeType = att.getOrDefault("mimeType", "");
                String name = att.getOrDefault("name", "file");
                String data = att.get("data");

                if (mimeType.startsWith("image/")) {
                    // Images are handled via --image flag; just note their presence
                    if (!hasFileContext) { fileCtx.append("[Attached files]\n"); hasFileContext = true; }
                    fileCtx.append("- Image: ").append(name).append("\n");
                } else if ((mimeType.equals("text/csv") || name.toLowerCase().endsWith(".csv")) && data != null) {
                    if (!hasFileContext) { fileCtx.append("[Attached files]\n"); hasFileContext = true; }
                    String csv = new String(Base64.getDecoder().decode(data), StandardCharsets.UTF_8);
                    if (csv.length() > 6000) csv = csv.substring(0, 6000) + "\n...(truncated)";
                    fileCtx.append("- CSV file: ").append(name).append("\n```csv\n").append(csv).append("\n```\n");
                } else {
                    if (!hasFileContext) { fileCtx.append("[Attached files]\n"); hasFileContext = true; }
                    fileCtx.append("- File: ").append(name).append(" (").append(mimeType).append(")\n");
                }
            }

            if (hasFileContext) {
                sb.append(fileCtx).append("\n");
            }
        }

        sb.append("User: ").append(userMessage);
        sb.append("\n\nAssistant:");
        return sb.toString();
    }
}
