package com.salesai.controller;

import com.salesai.dto.sales.AnalyzeRequest;
import com.salesai.dto.sales.ClientData;
import com.salesai.dto.sales.GoodToTradeResult;
import com.salesai.dto.sales.ProductData;
import com.salesai.service.SalesAgentService;
import com.salesai.service.SalesDataService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.List;

@RestController
@RequestMapping("/sales")
@RequiredArgsConstructor
@Slf4j
public class SalesController {

    private final SalesDataService salesDataService;
    private final SalesAgentService salesAgentService;

    /**
     * Agent 1 data source — Client/counterparty data (simulates CRM / internal DB).
     * Called by the sales agent to fetch client profile, KYC status, and restrictions.
     */
    @GetMapping("/clients")
    public ResponseEntity<List<ClientData>> getClients() {
        log.info("[Agent 1] GET /sales/clients — fetching client data");
        return ResponseEntity.ok(salesDataService.getAllClients());
    }

    /**
     * Agent 2 data source — Product catalog (simulates external product data source).
     * Called by the sales agent to fetch instrument details, eligibility, and ticket limits.
     */
    @GetMapping("/products")
    public ResponseEntity<List<ProductData>> getProducts() {
        log.info("[Agent 2] GET /sales/products — fetching product catalog");
        return ResponseEntity.ok(salesDataService.getAllProducts());
    }

    /**
     * Agent 3 data source — Good-to-Trade compliance check (simulates compliance engine).
     * Runs all rule checks for every client-product combination and returns results.
     */
    @GetMapping("/compliance/good-to-trade")
    public ResponseEntity<List<GoodToTradeResult>> getGoodToTradeChecks() {
        log.info("[Agent 3] GET /sales/compliance/good-to-trade — running GTT checks");
        return ResponseEntity.ok(salesDataService.getGoodToTradeChecks());
    }

    /**
     * Agent 4 orchestrator — Calls Agents 1-3, then invokes Claude CLI to analyze
     * the aggregated data and stream back either clarifying questions or a recommendation.
     *
     * Body: { clientId, productId, tradeSizeUsd (optional), query }
     */
    @PostMapping(value = "/analyze", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> analyze(@RequestBody AnalyzeRequest request) {
        log.info("[Agent 4] POST /sales/analyze — client={} product={} size={}",
            request.getClientId(), request.getProductId(), request.getTradeSizeUsd());
        return salesAgentService.analyze(request);
    }
}
