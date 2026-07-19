package com.salesai.dto.sales;

import lombok.Data;

@Data
public class AnalyzeRequest {
    private String clientId;
    private String productId;
    private Long tradeSizeUsd;
    private String query;
}
