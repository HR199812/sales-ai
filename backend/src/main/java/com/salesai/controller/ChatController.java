package com.salesai.controller;

import com.salesai.dto.ChatSessionDto;
import com.salesai.dto.CreateSessionRequest;
import com.salesai.dto.SendMessageRequest;
import com.salesai.entity.Message;
import com.salesai.repository.UserRepository;
import com.salesai.service.ChatService;
import com.salesai.service.ClaudeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import reactor.core.scheduler.Schedulers;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/chat")
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class ChatController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private ClaudeService claudeService;

    @Autowired
    private UserRepository userRepository;

    private String getUserId(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new RuntimeException("User not found"))
            .getId();
    }

    @PostMapping("/sessions")
    public ResponseEntity<ChatSessionDto> createSession(
        @RequestBody CreateSessionRequest request,
        Authentication auth) {
        ChatSessionDto session = chatService.createSession(getUserId(auth), request.getTitle());
        return ResponseEntity.ok(session);
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<ChatSessionDto>> getSessions(Authentication auth) {
        return ResponseEntity.ok(chatService.getUserSessions(getUserId(auth)));
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<ChatSessionDto> getSession(
        @PathVariable String sessionId, Authentication auth) {
        return ResponseEntity.ok(chatService.getSessionWithMessages(sessionId, getUserId(auth)));
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Void> deleteSession(
        @PathVariable String sessionId, Authentication auth) {
        chatService.deleteSession(sessionId, getUserId(auth));
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/sessions/{sessionId}/message", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter sendMessage(
        @PathVariable String sessionId,
        @RequestBody SendMessageRequest request,
        Authentication auth) {

        // auth is null for unauthenticated (guest) requests — skip all DB persistence
        final boolean isGuest = (auth == null || auth.getName() == null);
        final String userId = isGuest ? null : getUserId(auth);

        SseEmitter emitter = new SseEmitter(120_000L);

        if (!isGuest) {
            chatService.saveMessage(sessionId, userId, Message.MessageRole.USER, request.getContent());
        }

        // Prefer context from the client (localStorage history) to avoid MongoDB roundtrip
        List<Map<String, String>> context =
            (request.getContext() != null && !request.getContext().isEmpty())
                ? request.getContext()
                : (isGuest ? List.of() : chatService.getSessionContext(sessionId, userId));
        StringBuilder fullResponse = new StringBuilder();

        claudeService.streamClaude(request.getContent(), context, request.getAttachments())
            .subscribeOn(Schedulers.boundedElastic())
            .doOnNext(chunk -> {
                try {
                    if (!chunk.startsWith("__STATUS__:")) {
                        fullResponse.append(chunk);
                    }
                    emitter.send(SseEmitter.event().data(chunk));
                } catch (IOException e) {
                    emitter.completeWithError(e);
                }
            })
            .doOnComplete(() -> {
                if (!isGuest) {
                    chatService.saveMessage(sessionId, userId, Message.MessageRole.ASSISTANT, fullResponse.toString());
                }
                try {
                    emitter.send(SseEmitter.event().name("done").data("[DONE]"));
                } catch (IOException ignored) { }
                emitter.complete();
            })
            .doOnError(e -> {
                log.error("Claude streaming error", e);
                emitter.completeWithError(e);
            })
            .subscribe();

        return emitter;
    }
}
