package com.salesai.dto.sales;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ProductData {
    private String id;
    private String isin;
    private String ticker;
    private String name;
    private String type;               // Equity | Bond | ETF | Derivative | Structured Product
    private String exchange;
    private String currency;
    private String riskLevel;          // Low | Medium | High | Very High
    private long minTicketUsd;
    private long maxTicketUsd;
    private List<String> eligibleClientTypes;
    private List<String> restrictions;
    private double lastPrice;
    private String sector;
    private String status;             // Active | Suspended | Restricted
    private String description;
}
