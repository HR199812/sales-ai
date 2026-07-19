package com.salesai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.Collections;
import java.util.List;

@Data
@AllArgsConstructor
public class ValidationResult {
    private boolean proceed;
    private List<String> questions;

    public static ValidationResult proceed() {
        return new ValidationResult(true, Collections.emptyList());
    }

    public static ValidationResult needsClarification(List<String> questions) {
        return new ValidationResult(false, questions);
    }
}
