package com.salesai.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.scheduler.Schedulers;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class ClaudeService {

    public Flux<String> streamClaude(String userMessage, List<Map<String, String>> context) {
        return Flux.<String>create(sink -> {
            try {
                sink.next("__STATUS__:connecting");

                String prompt = buildPrompt(userMessage, context);
                ProcessBuilder pb = new ProcessBuilder("claude", "-p", prompt);
                pb.redirectErrorStream(false);
                // Starting the subprocess gives connecting state time to render
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
            }
        }).subscribeOn(Schedulers.boundedElastic());
    }

    private String buildPrompt(String userMessage, List<Map<String, String>> context) {
        if (context.isEmpty()) {
            return userMessage;
        }

        StringBuilder sb = new StringBuilder();
        sb.append("You are a helpful AI assistant for sales professionals.\n\n");
        sb.append("Conversation history:\n\n");

        for (Map<String, String> msg : context) {
            String role = "user".equals(msg.get("role")) ? "User" : "Assistant";
            sb.append(role).append(": ").append(msg.get("content")).append("\n\n");
        }

        sb.append("User: ").append(userMessage);
        sb.append("\n\nAssistant:");
        return sb.toString();
    }
}
