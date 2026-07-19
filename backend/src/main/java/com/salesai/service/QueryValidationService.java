package com.salesai.service;

import com.salesai.dto.ValidationResult;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Pre-flight agent: inspects the user's query (and prior conversation context) to determine
 * whether a sales trade analysis has enough information to proceed. If not, returns targeted
 * clarifying questions that are streamed back to the user before any Claude call is made.
 *
 * Rule-based (no additional Claude call) — adds zero latency to the happy path.
 */
@Service
public class QueryValidationService {

    // ── Detection patterns ──────────────────────────────────────────────────────

    private static final Pattern TRADE_QUERY = Pattern.compile(
        "\\b(trade|buy|sell|analyz|compliance|good.to.trade|gtt|pitch|suitab|suitability|" +
        "portfolio|position|execut|order|ticket|deal|book|transaction|invest|" +
        "product|instrument|stock|bond|etf|equity|future|derivative|option|" +
        "good to trade|check|assess|review|can.*trade|able.*trade|allowed.*trade)\\b",
        Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );

    private static final Pattern CLIENT_INFO = Pattern.compile(
        "\\b(c\\d{3}|apex|meridian|techventures|tech\\s*ventures|global\\s*pension|sunrise|" +
        "client\\s*(id|name|ref)?|counterparty\\s*(name|id)?|my\\s*client|the\\s*client|" +
        "institutional|retail|professional)\\b",
        Pattern.CASE_INSENSITIVE
    );

    private static final Pattern PRODUCT_INFO = Pattern.compile(
        "\\b(p\\d{3}|aapl|apple|tsla|tesla|spy|t.?bond|treasury|eur.?usd|crude|oil|" +
        "futures?|equity|equities|bond|note|derivative|etf|stock|index|forex|fx|" +
        "commodity|product\\s*(id|name|ref)?|instrument|ticker|isin|cusip|security)\\b",
        Pattern.CASE_INSENSITIVE
    );

    private static final Pattern SIZE_INFO = Pattern.compile(
        "\\$[\\d,]+|[\\d,.]+\\s*(usd|dollars?|million|m\\b|k\\b|bn|billion|thousand)|" +
        "\\b(notional|size|amount|quantity|volume|ticket\\s*size|trade\\s*size)\\b",
        Pattern.CASE_INSENSITIVE
    );

    private static final Pattern EXECUTION_INTENT = Pattern.compile(
        "\\b(trade|buy|sell|execute|book|order|transact|deal|place|enter)\\b",
        Pattern.CASE_INSENSITIVE
    );

    // ── Public API ──────────────────────────────────────────────────────────────

    /**
     * Validates the current message plus conversation history to determine if enough
     * context exists for a trade analysis. Checks the full conversation so the user
     * isn't re-asked for info they already provided.
     */
    public ValidationResult validate(String currentMessage, List<Map<String, String>> history) {
        if (!TRADE_QUERY.matcher(currentMessage).find()) {
            return ValidationResult.proceed(); // General question — no validation needed
        }

        // Build the full conversation context string for detecting previously provided info
        String fullContext = buildContext(currentMessage, history);

        boolean hasClient  = CLIENT_INFO.matcher(fullContext).find();
        boolean hasProduct = PRODUCT_INFO.matcher(fullContext).find();
        boolean hasSize    = SIZE_INFO.matcher(fullContext).find();
        boolean isExecution = EXECUTION_INTENT.matcher(currentMessage).find();

        List<String> questions = new ArrayList<>();

        if (!hasClient) {
            questions.add("Which client are you looking to trade for? " +
                "Please provide the client name or ID " +
                "(e.g., C001 – Apex Capital Partners, C002 – Meridian Wealth Management).");
        }

        if (!hasProduct) {
            questions.add("Which product or instrument are you considering? " +
                "(e.g., AAPL equity (P001), TSLA stock (P002), T-Bond (P003), " +
                "EUR/USD Structured Note (P004), SPY ETF (P005), Crude Oil Futures (P006)).");
        }

        // Only ask for size when doing an execution (not just an info/analysis request)
        // and only once we already know client + product (to avoid overwhelming with questions)
        if (isExecution && !hasSize && hasClient && hasProduct) {
            questions.add("What is the proposed trade size or notional amount? " +
                "(e.g., $500,000 — needed for ticket-size compliance checks).");
        }

        return questions.isEmpty()
            ? ValidationResult.proceed()
            : ValidationResult.needsClarification(questions);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────────

    private String buildContext(String currentMessage, List<Map<String, String>> history) {
        if (history == null || history.isEmpty()) return currentMessage;
        StringBuilder sb = new StringBuilder();
        for (Map<String, String> msg : history) {
            String content = msg.getOrDefault("content", "");
            if (!content.isBlank()) sb.append(content).append(" ");
        }
        sb.append(currentMessage);
        return sb.toString();
    }
}
