package com.salesai.dto.sales;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class GoodToTradeResult {
    private String checkId;
    private String clientId;
    private String productId;
    private String overallStatus;      // PASS | FAIL | REQUIRES_REVIEW
    private String timestamp;
    private List<ComplianceCheck> checks;

    @Data
    @Builder
    public static class ComplianceCheck {
        private String rule;
        private String status;         // PASS | FAIL | WARNING
        private String detail;
    }
}
