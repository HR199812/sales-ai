package com.salesai.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {

    @Id
    private String id;

    @Indexed
    private String sessionId;

    private MessageRole role;

    private String content;

    private Integer tokens;
    private String model;

    @Builder.Default
    private Boolean hasAttachments = false;

    private String metadata;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    public enum MessageRole {
        USER, ASSISTANT
    }
}
