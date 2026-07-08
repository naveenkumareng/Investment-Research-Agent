package com.investa.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class GeminiService {

    @Value("${api.gemini.key}")
    private String geminiApiKey;

    @Value("${api.gemini.base-url}")
    private String geminiBaseUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public GeminiService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public String generateAnalysis(String prompt) {
        if (geminiApiKey == null || geminiApiKey.contains("fake-gemini-key")) {
            log.warn("Using fake Gemini API key. Returning mock analysis.");
            return generateMockAnalysis();
        }

        try {
            String url = geminiBaseUrl + "?key=" + geminiApiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Constructing Gemini payload
            Map<String, Object> part = new HashMap<>();
            part.put("text", prompt);
            
            Map<String, Object> content = new HashMap<>();
            content.put("parts", List.of(part));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", List.of(content));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            JsonNode rootNode = objectMapper.readTree(response.getBody());
            JsonNode textNode = rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text");
            
            return textNode.asText();

        } catch (Exception e) {
            log.error("Failed to call Gemini API: ", e);
            return generateMockAnalysis();
        }
    }

    private String generateMockAnalysis() {
        return "{\n" +
                "  \"summary\": \"Based on the current market data, the stock shows strong momentum. Proceed with caution as volatility remains high.\",\n" +
                "  \"businessOverview\": \"A leading technology company specializing in consumer electronics and software services.\",\n" +
                "  \"growthPotential\": \"High growth potential driven by expanding AI capabilities and strong product pipeline.\",\n" +
                "  \"financialHealth\": \"Robust balance sheet with significant cash reserves and steady cash flow.\",\n" +
                "  \"fundamentalAnalysis\": \"Trading at a premium relative to peers, but justified by consistent earnings beats.\",\n" +
                "  \"technicalAnalysis\": \"Currently in an uptrend, holding above key moving averages with RSI indicating slightly overbought conditions.\",\n" +
                "  \"pros\": [\"Strong brand loyalty\", \"Consistent revenue growth\", \"Innovative product pipeline\"],\n" +
                "  \"cons\": [\"High valuation multiple\", \"Supply chain vulnerabilities\", \"Increasing competition\"],\n" +
                "  \"riskScore\": 45,\n" +
                "  \"confidenceScore\": 85,\n" +
                "  \"recommendation\": \"Buy\",\n" +
                "  \"targetPrice\": 250.00,\n" +
                "  \"futureOutlook\": \"Positive outlook for the next 12-18 months, assuming macroeconomic stability.\"\n" +
                "}";
    }
}
