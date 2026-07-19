package com.salesai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.salesai.dto.sales.AnalyzeRequest;
import com.salesai.dto.sales.ClientData;
import com.salesai.dto.sales.GoodToTradeResult;
import com.salesai.dto.sales.ProductData;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.scheduler.Schedulers;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.Optional;

/**
 * Orchestrates 3 data-fetch agents + 1 Claude analysis agent:
 *
 *  Agent 1 → fetch client data
 *  Agent 2 → fetch product data
 *  Agent 3 → run good-to-trade check
 *  Agent 4 → Claude CLI analyzes aggregated context → streams response
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SalesAgentService {

    private final SalesDataService salesDataService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Flux<String> analyze(AnalyzeRequest request) {
        return Flux.<String>create(sink -> {
            try {
                sink.next("__STATUS__:connecting");
                Thread.sleep(600);

                // ── Agent 1: Fetch client data ──────────────────────────────────
                sink.next("__STATUS__:agent1");
                log.info("[Agent 1] Fetching client data for: {}", request.getClientId());
                Optional<ClientData> clientOpt = salesDataService.findClient(request.getClientId());
                if (clientOpt.isEmpty()) {
                    sink.next("⚠️ Client not found: " + request.getClientId());
                    sink.complete();
                    return;
                }
                ClientData client = clientOpt.get();
                log.info("[Agent 1] Client found: {}", client.getName());
                Thread.sleep(700);

                // ── Agent 2: Fetch product data ─────────────────────────────────
                sink.next("__STATUS__:agent2");
                log.info("[Agent 2] Fetching product data for: {}", request.getProductId());
                Optional<ProductData> productOpt = salesDataService.findProduct(request.getProductId());
                if (productOpt.isEmpty()) {
                    sink.next("⚠️ Product not found: " + request.getProductId());
                    sink.complete();
                    return;
                }
                ProductData product = productOpt.get();
                log.info("[Agent 2] Product found: {}", product.getName());
                Thread.sleep(600);

                // ── Agent 3: Good-to-Trade check ────────────────────────────────
                sink.next("__STATUS__:agent3");
                log.info("[Agent 3] Running Good-to-Trade check");
                GoodToTradeResult gttResult = salesDataService.runGoodToTradeCheck(
                    request.getClientId(), request.getProductId(), request.getTradeSizeUsd()
                );
                log.info("[Agent 3] GTT result: {}", gttResult.getOverallStatus());
                Thread.sleep(500);

                // ── Agent 4: Claude analysis ─────────────────────────────────────
                sink.next("__STATUS__:thinking");
                log.info("[Agent 4] Calling Claude for analysis");
                String prompt = buildAnalysisPrompt(request, client, product, gttResult);

                ProcessBuilder pb = new ProcessBuilder("claude", "-p", prompt);
                pb.redirectErrorStream(false);
                Process process = pb.start();

                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(process.getInputStream()))) {
                    char[] buf = new char[32];
                    int n;
                    while ((n = reader.read(buf, 0, buf.length)) != -1) {
                        sink.next(new String(buf, 0, n));
                    }
                }

                int exitCode = process.waitFor();
                if (exitCode != 0) {
                    try (BufferedReader err = new BufferedReader(
                            new InputStreamReader(process.getErrorStream()))) {
                        String errMsg = err.lines().reduce("", (a, b) -> a + "\n" + b).trim();
                        log.error("[Agent 4] Claude CLI exited {}: {}", exitCode, errMsg);
                        sink.error(new RuntimeException("Claude agent error: " + errMsg));
                        return;
                    }
                }

                sink.next("__STATUS__:almost_done");
                sink.complete();
            } catch (Exception e) {
                log.error("Sales agent orchestration failed", e);
                sink.error(e);
            }
        }).subscribeOn(Schedulers.boundedElastic());
    }

    private String buildAnalysisPrompt(AnalyzeRequest request, ClientData client,
                                        ProductData product, GoodToTradeResult gtt) {
        StringBuilder sb = new StringBuilder();

        sb.append("""
            You are a senior sales compliance analyst at a financial institution.
            You have been given the following context from three separate data systems.
            Your job is to analyze the situation and produce a clear, professional response.

            RULES:
            - If the query lacks critical information (e.g. trade size is missing and it matters), \
            ask specific clarifying questions numbered as Q1, Q2, etc.
            - If you have enough information, provide a final recommendation: \
            PROCEED, DO_NOT_PROCEED, or PROCEED_WITH_CONDITIONS.
            - Always explain your reasoning with reference to the compliance checks.
            - Be concise but thorough. Use bullet points where helpful.
            - Structure your response as:

              ## Recommendation: [PROCEED | DO_NOT_PROCEED | PROCEED_WITH_CONDITIONS | NEEDS_CLARIFICATION]

              ### Summary
              [1-2 sentence summary]

              ### Client Profile
              [Key facts about the client relevant to this trade]

              ### Product Overview
              [Key facts about the product]

              ### Compliance Analysis
              [Walk through each check result and its implication]

              ### Conditions / Next Steps
              [List any conditions that must be met, or questions that need answers]

            """);

        sb.append("## SALES QUERY\n");
        sb.append(request.getQuery() != null ? request.getQuery() : "Analyze this client-product combination.");
        sb.append("\n\n");

        if (request.getTradeSizeUsd() != null) {
            sb.append("Requested trade size: $").append(String.format("%,d", request.getTradeSizeUsd())).append("\n\n");
        } else {
            sb.append("Trade size: Not specified\n\n");
        }

        sb.append("## AGENT 1 — CLIENT DATA (CRM)\n");
        sb.append("Client ID: ").append(client.getId()).append("\n");
        sb.append("Name: ").append(client.getName()).append("\n");
        sb.append("Type: ").append(client.getType()).append("\n");
        sb.append("Tier: ").append(client.getTier()).append("\n");
        sb.append("Risk Rating: ").append(client.getRiskRating()).append("\n");
        sb.append("Jurisdiction: ").append(client.getJurisdiction()).append("\n");
        sb.append("KYC Status: ").append(client.getKycStatus()).append("\n");
        sb.append("AUM: $").append(String.format("%,d", client.getAumUsd())).append("\n");
        sb.append("Restrictions: ").append(client.getRestrictions()).append("\n");
        sb.append("Status: ").append(client.getStatus()).append("\n\n");

        sb.append("## AGENT 2 — PRODUCT DATA (Product Catalog)\n");
        sb.append("Product ID: ").append(product.getId()).append("\n");
        sb.append("Name: ").append(product.getName()).append(" (").append(product.getTicker()).append(")\n");
        sb.append("Type: ").append(product.getType()).append("\n");
        sb.append("Risk Level: ").append(product.getRiskLevel()).append("\n");
        sb.append("Exchange: ").append(product.getExchange()).append("\n");
        sb.append("Currency: ").append(product.getCurrency()).append("\n");
        sb.append("Last Price: ").append(product.getLastPrice()).append("\n");
        sb.append("Min Ticket: $").append(String.format("%,d", product.getMinTicketUsd())).append("\n");
        sb.append("Max Ticket: $").append(String.format("%,d", product.getMaxTicketUsd())).append("\n");
        sb.append("Eligible Client Types: ").append(product.getEligibleClientTypes()).append("\n");
        sb.append("Status: ").append(product.getStatus()).append("\n");
        sb.append("Description: ").append(product.getDescription()).append("\n\n");

        sb.append("## AGENT 3 — GOOD-TO-TRADE CHECK (Compliance Engine)\n");
        sb.append("Overall Status: ").append(gtt.getOverallStatus()).append("\n");
        sb.append("Checks:\n");
        for (GoodToTradeResult.ComplianceCheck check : gtt.getChecks()) {
            sb.append("  [").append(check.getStatus()).append("] ")
              .append(check.getRule()).append(": ").append(check.getDetail()).append("\n");
        }

        sb.append("\n## AGENT 4 — YOUR ANALYSIS\n");
        sb.append("Based on the above, provide your structured response:\n");

        return sb.toString();
    }
}
