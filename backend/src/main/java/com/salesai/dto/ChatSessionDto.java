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
