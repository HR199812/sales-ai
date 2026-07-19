package com.salesai.service;

import com.salesai.dto.sales.ClientData;
import com.salesai.dto.sales.GoodToTradeResult;
import com.salesai.dto.sales.GoodToTradeResult.ComplianceCheck;
import com.salesai.dto.sales.ProductData;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class SalesDataService {

    // ── Dummy Client Data (simulates CRM / database) ──────────────────────────

    public List<ClientData> getAllClients() {
        return List.of(
            ClientData.builder()
                .id("C001").name("Apex Capital Partners").type("Institutional").tier("Platinum")
                .riskRating("Medium").jurisdiction("US").kycStatus("Approved")
                .aumUsd(2_500_000_000L).onboardingDate("2021-06-15")
                .restrictions(List.of("NO_DERIVATIVES"))
                .relationshipManager("Sarah Chen").lastContact("2024-01-10").status("Active")
                .build(),

            ClientData.builder()
                .id("C002").name("Meridian Wealth Management").type("Institutional").tier("Gold")
                .riskRating("Low").jurisdiction("UK").kycStatus("Approved")
                .aumUsd(800_000_000L).onboardingDate("2020-03-22")
                .restrictions(List.of())
                .relationshipManager("James Liu").lastContact("2024-01-08").status("Active")
                .build(),

            ClientData.builder()
                .id("C003").name("TechVentures LLC").type("Professional").tier("Silver")
                .riskRating("High").jurisdiction("US").kycStatus("Approved")
                .aumUsd(120_000_000L).onboardingDate("2023-01-10")
                .restrictions(List.of())
                .relationshipManager("Priya Sharma").lastContact("2024-01-12").status("Active")
                .build(),

            ClientData.builder()
                .id("C004").name("Global Pension Fund").type("Institutional").tier("Platinum")
                .riskRating("Low").jurisdiction("EU").kycStatus("Expired")
                .aumUsd(5_000_000_000L).onboardingDate("2019-09-01")
                .restrictions(List.of("LOW_RISK_ONLY"))
                .relationshipManager("Maria Gonzalez").lastContact("2023-11-15").status("Active")
                .build(),

            ClientData.builder()
                .id("C005").name("Sunrise Retail Investors").type("Retail").tier("Bronze")
                .riskRating("Low").jurisdiction("US").kycStatus("Approved")
                .aumUsd(500_000L).onboardingDate("2023-08-20")
                .restrictions(List.of("NO_STRUCTURED_PRODUCTS", "MAX_TICKET_50K"))
                .relationshipManager("Tom Park").lastContact("2024-01-05").status("Active")
                .build()
        );
    }

    // ── Dummy Product Data (simulates product catalog / external source) ───────

    public List<ProductData> getAllProducts() {
        return List.of(
            ProductData.builder()
                .id("P001").isin("US0378331005").ticker("AAPL").name("Apple Inc")
                .type("Equity").exchange("NASDAQ").currency("USD").riskLevel("Low")
                .minTicketUsd(10_000L).maxTicketUsd(50_000_000L)
                .eligibleClientTypes(List.of("Retail", "Professional", "Institutional"))
                .restrictions(List.of()).lastPrice(185.20).sector("Technology").status("Active")
                .description("Large-cap US technology equity.")
                .build(),

            ProductData.builder()
                .id("P002").isin("US88160R1014").ticker("TSLA").name("Tesla Inc")
                .type("Equity").exchange("NASDAQ").currency("USD").riskLevel("High")
                .minTicketUsd(50_000L).maxTicketUsd(10_000_000L)
                .eligibleClientTypes(List.of("Professional", "Institutional"))
                .restrictions(List.of()).lastPrice(242.84).sector("Automotive").status("Active")
                .description("High-volatility electric vehicle manufacturer.")
                .build(),

            ProductData.builder()
                .id("P003").isin("US912810TM79").ticker("T10Y").name("US Treasury 10Y Bond")
                .type("Bond").exchange("OTC").currency("USD").riskLevel("Low")
                .minTicketUsd(100_000L).maxTicketUsd(100_000_000L)
                .eligibleClientTypes(List.of("Retail", "Professional", "Institutional"))
                .restrictions(List.of()).lastPrice(97.50).sector("Government").status("Active")
                .description("10-year US government treasury bond.")
                .build(),

            ProductData.builder()
                .id("P004").isin("XS2345678901").ticker("EURUSD-NOTE").name("EUR/USD Structured Note 2026")
                .type("Structured Product").exchange("OTC").currency("USD").riskLevel("High")
                .minTicketUsd(250_000L).maxTicketUsd(5_000_000L)
                .eligibleClientTypes(List.of("Professional", "Institutional"))
                .restrictions(List.of("ACCREDITED_INVESTOR_ONLY"))
                .lastPrice(100.0).sector("FX").status("Active")
                .description("Capital-at-risk structured note linked to EUR/USD exchange rate.")
                .build(),

            ProductData.builder()
                .id("P005").isin("US78462F1030").ticker("SPY").name("S&P 500 ETF")
                .type("ETF").exchange("NYSE").currency("USD").riskLevel("Low")
                .minTicketUsd(5_000L).maxTicketUsd(100_000_000L)
                .eligibleClientTypes(List.of("Retail", "Professional", "Institutional"))
                .restrictions(List.of()).lastPrice(471.30).sector("Index").status("Active")
                .description("Passive ETF tracking the S&P 500 index.")
                .build(),

            ProductData.builder()
                .id("P006").isin("US12345CL001").ticker("CLF25").name("Crude Oil Futures Mar-25")
                .type("Derivative").exchange("CME").currency("USD").riskLevel("Very High")
                .minTicketUsd(500_000L).maxTicketUsd(50_000_000L)
                .eligibleClientTypes(List.of("Professional", "Institutional"))
                .restrictions(List.of("DERIVATIVES_APPROVED_ONLY"))
                .lastPrice(78.45).sector("Commodities").status("Active")
                .description("WTI crude oil futures contract — significant leverage and commodity risk.")
                .build()
        );
    }

    // ── Good to Trade Check (rule engine) ─────────────────────────────────────

    public List<GoodToTradeResult> getGoodToTradeChecks() {
        List<ClientData> clients = getAllClients();
        List<ProductData> products = getAllProducts();

        Map<String, ClientData> clientMap = clients.stream()
            .collect(Collectors.toMap(ClientData::getId, Function.identity()));
        Map<String, ProductData> productMap = products.stream()
            .collect(Collectors.toMap(ProductData::getId, Function.identity()));

        List<GoodToTradeResult> results = new ArrayList<>();
        for (ClientData client : clients) {
            for (ProductData product : products) {
                results.add(runGoodToTradeCheck(client, product));
            }
        }
        return results;
    }

    public GoodToTradeResult runGoodToTradeCheck(String clientId, String productId, Long tradeSizeUsd) {
        Map<String, ClientData> clientMap = getAllClients().stream()
            .collect(Collectors.toMap(ClientData::getId, Function.identity()));
        Map<String, ProductData> productMap = getAllProducts().stream()
            .collect(Collectors.toMap(ProductData::getId, Function.identity()));

        ClientData client = clientMap.get(clientId);
        ProductData product = productMap.get(productId);

        if (client == null || product == null) {
            return GoodToTradeResult.builder()
                .checkId("GTC-ERROR").clientId(clientId).productId(productId)
                .overallStatus("FAIL").timestamp(Instant.now().toString())
                .checks(List.of(ComplianceCheck.builder()
                    .rule("DATA_FOUND").status("FAIL")
                    .detail("Client or product not found in system").build()))
                .build();
        }

        GoodToTradeResult result = runGoodToTradeCheck(client, product);

        // Add optional trade size check
        if (tradeSizeUsd != null) {
            List<ComplianceCheck> checks = new ArrayList<>(result.getChecks());
            String ticketStatus;
            String ticketDetail;
            if (tradeSizeUsd < product.getMinTicketUsd()) {
                ticketStatus = "FAIL";
                ticketDetail = String.format("Trade size $%,d is below minimum ticket $%,d",
                    tradeSizeUsd, product.getMinTicketUsd());
            } else if (tradeSizeUsd > product.getMaxTicketUsd()) {
                ticketStatus = "FAIL";
                ticketDetail = String.format("Trade size $%,d exceeds maximum ticket $%,d",
                    tradeSizeUsd, product.getMaxTicketUsd());
            } else {
                ticketStatus = "PASS";
                ticketDetail = String.format("Trade size $%,d is within allowed range ($%,d – $%,d)",
                    tradeSizeUsd, product.getMinTicketUsd(), product.getMaxTicketUsd());
            }
            checks.add(ComplianceCheck.builder().rule("TICKET_SIZE")
                .status(ticketStatus).detail(ticketDetail).build());

            boolean anyFail = checks.stream().anyMatch(c -> "FAIL".equals(c.getStatus()));
            boolean anyWarning = checks.stream().anyMatch(c -> "WARNING".equals(c.getStatus()));
            String overall = anyFail ? "FAIL" : (anyWarning ? "REQUIRES_REVIEW" : "PASS");
            result.setChecks(checks);
            result.setOverallStatus(overall);
        }

        return result;
    }

    private GoodToTradeResult runGoodToTradeCheck(ClientData client, ProductData product) {
        List<ComplianceCheck> checks = new ArrayList<>();

        // Rule 1: KYC must be Approved
        boolean kycPass = "Approved".equals(client.getKycStatus());
        checks.add(ComplianceCheck.builder()
            .rule("KYC_CURRENT")
            .status(kycPass ? "PASS" : "FAIL")
            .detail(kycPass
                ? "KYC status is current and approved"
                : "KYC status is " + client.getKycStatus() + " — must be renewed before trading")
            .build());

        // Rule 2: Product must be Active
        boolean productActive = "Active".equals(product.getStatus());
        checks.add(ComplianceCheck.builder()
            .rule("PRODUCT_ACTIVE")
            .status(productActive ? "PASS" : "FAIL")
            .detail(productActive
                ? "Product is active and tradeable"
                : "Product status is " + product.getStatus())
            .build());

        // Rule 3: Client type eligible for product
        boolean typeEligible = product.getEligibleClientTypes().contains(client.getType());
        checks.add(ComplianceCheck.builder()
            .rule("CLIENT_TYPE_ELIGIBILITY")
            .status(typeEligible ? "PASS" : "FAIL")
            .detail(typeEligible
                ? client.getType() + " clients are eligible for this product"
                : client.getType() + " clients are not eligible; allowed: " + product.getEligibleClientTypes())
            .build());

        // Rule 4: Risk suitability
        boolean riskSuitable = isRiskSuitable(client.getRiskRating(), product.getRiskLevel());
        checks.add(ComplianceCheck.builder()
            .rule("RISK_SUITABILITY")
            .status(riskSuitable ? "PASS" : "WARNING")
            .detail(riskSuitable
                ? "Product risk level is suitable for client risk rating"
                : "Product risk (" + product.getRiskLevel() + ") may exceed client risk appetite (" + client.getRiskRating() + ")")
            .build());

        // Rule 5: Client restrictions
        List<String> triggeredRestrictions = getTriggeredRestrictions(client, product);
        boolean restrictionsPass = triggeredRestrictions.isEmpty();
        checks.add(ComplianceCheck.builder()
            .rule("CLIENT_RESTRICTIONS")
            .status(restrictionsPass ? "PASS" : "FAIL")
            .detail(restrictionsPass
                ? "No client restrictions apply to this product"
                : "Client restriction triggered: " + String.join(", ", triggeredRestrictions))
            .build());

        // Rule 6: Jurisdiction
        boolean jurisdictionOk = !("EU".equals(client.getJurisdiction()) && "Derivative".equals(product.getType()));
        checks.add(ComplianceCheck.builder()
            .rule("JURISDICTION")
            .status(jurisdictionOk ? "PASS" : "FAIL")
            .detail(jurisdictionOk
                ? "Product available in client jurisdiction (" + client.getJurisdiction() + ")"
                : "This product type is restricted for EU clients under MiFID II")
            .build());

        boolean anyFail = checks.stream().anyMatch(c -> "FAIL".equals(c.getStatus()));
        boolean anyWarning = checks.stream().anyMatch(c -> "WARNING".equals(c.getStatus()));
        String overall = anyFail ? "FAIL" : (anyWarning ? "REQUIRES_REVIEW" : "PASS");

        return GoodToTradeResult.builder()
            .checkId("GTC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
            .clientId(client.getId())
            .productId(product.getId())
            .overallStatus(overall)
            .timestamp(Instant.now().toString())
            .checks(checks)
            .build();
    }

    private boolean isRiskSuitable(String clientRisk, String productRisk) {
        Map<String, Integer> levels = Map.of(
            "Low", 1, "Medium", 2, "High", 3, "Very High", 4
        );
        int clientLevel = levels.getOrDefault(clientRisk, 2);
        int productLevel = levels.getOrDefault(productRisk, 2);
        return productLevel <= clientLevel + 1;
    }

    private List<String> getTriggeredRestrictions(ClientData client, ProductData product) {
        List<String> triggered = new ArrayList<>();
        for (String restriction : client.getRestrictions()) {
            switch (restriction) {
                case "NO_DERIVATIVES" -> {
                    if ("Derivative".equals(product.getType())) triggered.add("NO_DERIVATIVES");
                }
                case "NO_STRUCTURED_PRODUCTS" -> {
                    if ("Structured Product".equals(product.getType())) triggered.add("NO_STRUCTURED_PRODUCTS");
                }
                case "LOW_RISK_ONLY" -> {
                    if (!"Low".equals(product.getRiskLevel())) triggered.add("LOW_RISK_ONLY");
                }
                case "MAX_TICKET_50K" -> {
                    // Checked separately with trade size
                }
            }
        }
        return triggered;
    }

    public Optional<ClientData> findClient(String clientId) {
        return getAllClients().stream().filter(c -> c.getId().equals(clientId)).findFirst();
    }

    public Optional<ProductData> findProduct(String productId) {
        return getAllProducts().stream().filter(p -> p.getId().equals(productId)).findFirst();
    }
}
