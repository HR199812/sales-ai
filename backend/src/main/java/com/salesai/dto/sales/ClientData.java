package com.salesai.dto.sales;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ClientData {
    private String id;
    private String name;
    private String type;           // Retail | Professional | Institutional
    private String tier;           // Bronze | Silver | Gold | Platinum
    private String riskRating;     // Low | Medium | High
    private String jurisdiction;
    private String kycStatus;      // Approved | Pending | Expired
    private long aumUsd;
    private String onboardingDate;
    private List<String> restrictions;
    private String relationshipManager;
    private String lastContact;
    private String status;         // Active | Suspended
}
