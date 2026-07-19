# Spring Boot Backend Boilerplate for Sales-AI

## Quick Setup

```bash
cd ~/Documents/sales-ai/backend
mvn clean install
mvn spring-boot:run
```

---

## File: SalesAiApplication.java

```java
package com.salesai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication
public class SalesAiApplication {

    public static void main(String[] args) {
        SpringApplication.run(SalesAiApplication.class, args);
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                    .allowedOrigins("http://localhost:3000", "http://localhost:5173")
                    .allowedMethods("*")
                    .allowedHeaders("*")
                    .allowCredentials(true)
                    .maxAge(3600);
            }
        };
    }
}
```

---

## File: application.yml

```yaml
spring:
  application:
    name: sales-ai-backend
  
  datasource:
    url: jdbc:mysql://localhost:3306/sales_ai_db?useSSL=false&serverTimezone=UTC
    username: root
    password: password
    driver-class-name: com.mysql.cj.jdbc.Driver
  
  jpa:
    hibernate:
      ddl-auto: update
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQL8Dialect
        format_sql: true
    show-sql: false
  
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 10MB

server:
  port: 8080
  servlet:
    context-path: /api

logging:
  level:
    root: INFO
    com.salesai: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"

jwt:
  secret: ${JWT_SECRET:your-secret-key-change-in-production-min-32-chars}
  expiration: ${JWT_EXPIRATION:86400000}

claude:
  api-key: ${CLAUDE_API_KEY}
  api-url: https://api.anthropic.com/v1/messages
  model: claude-opus-4-1
```

---

## File: User.java (Entity)

```java
package com.salesai.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    @Column(nullable = false)
    private String firstName;
    
    @Column(nullable = false)
    private String lastName;
    
    @Builder.Default
    private Boolean enabled = true;
    
    @Builder.Default
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @Column(length = 500)
    private String preferences;
}
```

---

## File: ChatSession.java (Entity)

```java
package com.salesai.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "chat_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatSession {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false)
    private String title;
    
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Message> messages = new ArrayList<>();
    
    @Builder.Default
    private Boolean archived = false;
    
    @Builder.Default
    private Integer messageCount = 0;
    
    private LocalDateTime lastMessageTimestamp;
    
    @Builder.Default
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
```

---

## File: Message.java (Entity)

```java
package com.salesai.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private ChatSession session;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MessageRole role;
    
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String content;
    
    private Integer tokens;
    
    private String model;
    
    @Builder.Default
    private Boolean hasAttachments = false;
    
    @Column(columnDefinition = "JSON")
    private String metadata;
    
    @Builder.Default
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp = LocalDateTime.now();
    
    public enum MessageRole {
        USER, ASSISTANT
    }
}
```

---

## File: UserRepository.java

```java
package com.salesai.repository;

import com.salesai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);
}
```

---

## File: ChatSessionRepository.java

```java
package com.salesai.repository;

import com.salesai.entity.ChatSession;
import com.salesai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, String> {
    List<ChatSession> findByUserOrderByUpdatedAtDesc(User user);
    List<ChatSession> findByUserAndArchivedFalse(User user);
    boolean existsByIdAndUser(String id, User user);
}
```

---

## File: MessageRepository.java

```java
package com.salesai.repository;

import com.salesai.entity.Message;
import com.salesai.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, String> {
    List<Message> findBySessionOrderByTimestampAsc(ChatSession session);
    List<Message> findBySessionOrderByTimestampDesc(ChatSession session, 
        org.springframework.data.domain.Pageable pageable);
}
```

---

## File: JwtTokenProvider.java

```java
package com.salesai.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtTokenProvider {
    
    @Value("${jwt.secret}")
    private String jwtSecret;
    
    @Value("${jwt.expiration}")
    private long jwtExpiration;
    
    private Key getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
    
    public String generateToken(String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);
        
        return Jwts.builder()
            .setSubject(email)
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(getSigningKey(), SignatureAlgorithm.HS512)
            .compact();
    }
    
    public String getEmailFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
            .setSigningKey(getSigningKey())
            .build()
            .parseClaimsJws(token)
            .getBody();
        
        return claims.getSubject();
    }
    
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
```

---

## File: JwtAuthenticationFilter.java

```java
package com.salesai.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;

public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                  HttpServletResponse response,
                                  FilterChain filterChain) throws ServletException, IOException {
        String token = getJwtFromRequest(request);
        
        if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
            String email = jwtTokenProvider.getEmailFromToken(token);
            UsernamePasswordAuthenticationToken authentication = 
                new UsernamePasswordAuthenticationToken(email, null, new ArrayList<>());
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }
        
        filterChain.doFilter(request, response);
    }
    
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
```

---

## File: SecurityConfig.java

```java
package com.salesai.config;

import com.salesai.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter();
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf().disable()
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/health").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}
```

---

## File: AuthService.java

```java
package com.salesai.service;

import com.salesai.entity.User;
import com.salesai.repository.UserRepository;
import com.salesai.security.JwtTokenProvider;
import com.salesai.dto.AuthRequest;
import com.salesai.dto.AuthResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    
    public AuthResponse register(AuthRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        
        User user = User.builder()
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .build();
        
        userRepository.save(user);
        String token = jwtTokenProvider.generateToken(user.getEmail());
        
        return AuthResponse.builder()
            .token(token)
            .userId(user.getId())
            .email(user.getEmail())
            .build();
    }
    
    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }
        
        String token = jwtTokenProvider.generateToken(user.getEmail());
        
        return AuthResponse.builder()
            .token(token)
            .userId(user.getId())
            .email(user.getEmail())
            .build();
    }
}
```

---

## File: ChatService.java

```java
package com.salesai.service;

import com.salesai.entity.ChatSession;
import com.salesai.entity.Message;
import com.salesai.entity.User;
import com.salesai.repository.ChatSessionRepository;
import com.salesai.repository.MessageRepository;
import com.salesai.repository.UserRepository;
import com.salesai.dto.ChatSessionDto;
import com.salesai.dto.MessageDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ChatService {
    
    @Autowired
    private ChatSessionRepository sessionRepository;
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    public ChatSessionDto createSession(Long userId, String title) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        ChatSession session = ChatSession.builder()
            .user(user)
            .title(title)
            .build();
        
        ChatSession saved = sessionRepository.save(session);
        return mapToDto(saved);
    }
    
    public MessageDto saveMessage(String sessionId, Long userId, 
                                   Message.MessageRole role, String content) {
        ChatSession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session not found"));
        
        if (!session.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        
        Message message = Message.builder()
            .session(session)
            .role(role)
            .content(content)
            .build();
        
        Message saved = messageRepository.save(message);
        
        // Update session
        session.setMessageCount(session.getMessageCount() + 1);
        session.setLastMessageTimestamp(LocalDateTime.now());
        session.setUpdatedAt(LocalDateTime.now());
        sessionRepository.save(session);
        
        return mapToDto(saved);
    }
    
    public List<ChatSessionDto> getUserSessions(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        return sessionRepository.findByUserOrderByUpdatedAtDesc(user)
            .stream()
            .map(this::mapToDto)
            .collect(Collectors.toList());
    }
    
    public ChatSessionDto getSessionWithMessages(String sessionId, Long userId) {
        ChatSession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session not found"));
        
        if (!session.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        
        return mapToDtoWithMessages(session);
    }
    
    public void deleteSession(String sessionId, Long userId) {
        ChatSession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session not found"));
        
        if (!session.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        
        sessionRepository.delete(session);
        log.info("Deleted session: {}", sessionId);
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
    
    private ChatSessionDto mapToDtoWithMessages(ChatSession session) {
        List<MessageDto> messages = session.getMessages().stream()
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
```

---

## File: WebSocketConfig.java

```java
package com.salesai.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/chat")
            .setAllowedOrigins("http://localhost:3000", "http://localhost:5173")
            .withSockJS();
    }
}
```

---

## File: ClaudeService.java

```java
package com.salesai.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Flux;
import java.util.*;

@Service
@Slf4j
public class ClaudeService {
    
    @Value("${claude.api-key}")
    private String apiKey;
    
    @Value("${claude.api-url}")
    private String apiUrl;
    
    @Value("${claude.model}")
    private String model;
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    public Flux<String> streamClaude(String userMessage, List<Map<String, String>> context) {
        return Flux.create(sink -> {
            try {
                List<Map<String, String>> messages = new ArrayList<>(context);
                messages.add(Map.of(
                    "role", "user",
                    "content", userMessage
                ));
                
                Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "max_tokens", 2048,
                    "stream", true,
                    "messages", messages,
                    "system", buildSystemPrompt()
                );
                
                HttpHeaders headers = new HttpHeaders();
                headers.set("Authorization", "Bearer " + apiKey);
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.set("anthropic-version", "2023-06-01");
                
                HttpEntity<String> entity = new HttpEntity<>(
                    objectMapper.writeValueAsString(requestBody),
                    headers
                );
                
                // TODO: Implement streaming response handling
                // For now, use reactive WebClient instead of RestTemplate
                log.info("Stream request sent to Claude API");
                sink.complete();
                
            } catch (Exception e) {
                log.error("Error streaming from Claude: ", e);
                sink.error(e);
            }
        });
    }
    
    private String buildSystemPrompt() {
        return "You are a helpful AI assistant for sales. Be professional and concise.";
    }
}
```

---

## File: AuthController.java

```java
package com.salesai.controller;

import com.salesai.service.AuthService;
import com.salesai.dto.AuthRequest;
import com.salesai.dto.AuthResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/auth")
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class AuthController {
    
    @Autowired
    private AuthService authService;
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Backend is running");
    }
}
```

---

## File: ChatController.java

```java
package com.salesai.controller;

import com.salesai.service.ChatService;
import com.salesai.dto.ChatSessionDto;
import com.salesai.dto.CreateSessionRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;
import java.util.List;

@RestController
@RequestMapping("/chat")
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class ChatController {
    
    @Autowired
    private ChatService chatService;
    
    private Long getUserId(Authentication auth) {
        // Extract userId from JWT token
        // This is simplified - implement proper extraction
        return 1L;
    }
    
    @PostMapping("/sessions")
    public ResponseEntity<ChatSessionDto> createSession(
        @RequestBody CreateSessionRequest request,
        Authentication auth) {
        Long userId = getUserId(auth);
        ChatSessionDto session = chatService.createSession(userId, request.getTitle());
        return ResponseEntity.ok(session);
    }
    
    @GetMapping("/sessions")
    public ResponseEntity<List<ChatSessionDto>> getSessions(Authentication auth) {
        Long userId = getUserId(auth);
        List<ChatSessionDto> sessions = chatService.getUserSessions(userId);
        return ResponseEntity.ok(sessions);
    }
    
    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<ChatSessionDto> getSession(
        @PathVariable String sessionId,
        Authentication auth) {
        Long userId = getUserId(auth);
        ChatSessionDto session = chatService.getSessionWithMessages(sessionId, userId);
        return ResponseEntity.ok(session);
    }
    
    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Void> deleteSession(
        @PathVariable String sessionId,
        Authentication auth) {
        Long userId = getUserId(auth);
        chatService.deleteSession(sessionId, userId);
        return ResponseEntity.noContent().build();
    }
}
```

---

## File: DTO Classes

### AuthRequest.java
```java
package com.salesai.dto;

import lombok.Data;

@Data
public class AuthRequest {
    private String email;
    private String password;
    private String firstName;
    private String lastName;
}
```

### AuthResponse.java
```java
package com.salesai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private Long userId;
    private String email;
}
```

### ChatSessionDto.java
```java
package com.salesai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatSessionDto {
    private String id;
    private String title;
    private Integer messageCount;
    private List<MessageDto> messages;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### MessageDto.java
```java
package com.salesai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDto {
    private String id;
    private String role;
    private String content;
    private Integer tokens;
    private LocalDateTime timestamp;
}
```

### CreateSessionRequest.java
```java
package com.salesai.dto;

import lombok.Data;

@Data
public class CreateSessionRequest {
    private String title;
}
```

---

## Dockerfile for Spring Boot

```dockerfile
FROM maven:3.9.0-eclipse-temurin-17 AS builder

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline

COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY --from=builder /app/target/sales-ai-backend-1.0.0.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

