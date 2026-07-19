package com.salesai.service;

import com.salesai.entity.ChatSession;
import com.salesai.entity.Message;
import com.salesai.repository.ChatSessionRepository;
import com.salesai.repository.MessageRepository;
import com.salesai.dto.ChatSessionDto;
import com.salesai.dto.MessageDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ChatService {

    @Autowired
    private ChatSessionRepository sessionRepository;

    @Autowired
    private MessageRepository messageRepository;

    public ChatSessionDto createSession(String userId, String title) {
        ChatSession session = ChatSession.builder()
            .userId(userId)
            .title(title)
            .build();

        ChatSession saved = sessionRepository.save(session);
        log.info("Created session {} for user {}", saved.getId(), userId);
        return mapToDto(saved);
    }

    public MessageDto saveMessage(String sessionId, String userId,
                                   Message.MessageRole role, String content) {
        ChatSession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!session.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        Message message = Message.builder()
            .sessionId(sessionId)
            .role(role)
            .content(content)
            .build();

        Message saved = messageRepository.save(message);

        session.setMessageCount(session.getMessageCount() + 1);
        session.setLastMessageTimestamp(LocalDateTime.now());
        session.setUpdatedAt(LocalDateTime.now());
        sessionRepository.save(session);

        return mapToDto(saved);
    }

    public List<ChatSessionDto> getUserSessions(String userId) {
        return sessionRepository.findByUserIdOrderByUpdatedAtDesc(userId)
            .stream()
            .map(this::mapToDto)
            .collect(Collectors.toList());
    }

    public ChatSessionDto getSessionWithMessages(String sessionId, String userId) {
        ChatSession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!session.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        List<MessageDto> messages = messageRepository
            .findBySessionIdOrderByTimestampAsc(sessionId)
            .stream()
            .map(this::mapToDto)
            .collect(Collectors.toList());

        return ChatSessionDto.builder()
            .id(session.getId())
            .title(session.getTitle())
            .messageCount(session.getMessageCount())
            .messages(messages)
            .createdAt(session.getCreatedAt())
            .updatedAt(session.getUpdatedAt())
            .build();
    }

    public void deleteSession(String sessionId, String userId) {
        ChatSession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!session.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        messageRepository.deleteAll(
            messageRepository.findBySessionIdOrderByTimestampAsc(sessionId)
        );
        sessionRepository.delete(session);
        log.info("Deleted session: {}", sessionId);
    }

    public List<Map<String, String>> getSessionContext(String sessionId, String userId) {
        ChatSession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session not found"));

        if (!session.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        return messageRepository.findBySessionIdOrderByTimestampAsc(sessionId)
            .stream()
            .map(msg -> Map.of(
                "role", msg.getRole() == Message.MessageRole.USER ? "user" : "assistant",
                "content", msg.getContent()
            ))
            .collect(Collectors.toList());
    }

    private ChatSessionDto mapToDto(ChatSession session) {
        return ChatSessionDto.builder()
            .id(session.getId())
            .title(session.getTitle())
            .messageCount(session.getMessageCount())
            .createdAt(session.getCreatedAt())
            .updatedAt(session.getUpdatedAt())
            .build();
    }

    private MessageDto mapToDto(Message message) {
        return MessageDto.builder()
            .id(message.getId())
            .role(message.getRole().toString())
            .content(message.getContent())
            .tokens(message.getTokens())
            .timestamp(message.getTimestamp())
            .build();
    }
}
