package com.salesai.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class SendMessageRequest {
    private String content;
    /** Conversation history from the client (localStorage). Used instead of MongoDB when provided. */
    private List<Map<String, String>> context;
    /** Attached files: [{name, mimeType, data (base64, null for xlsx)}] */
    private List<Map<String, String>> attachments;
}
