package com.investa.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Slf4j
public class AnalysisService {

    private final GeminiService geminiService;
    private final FinnhubService finnhubService;
    private final ObjectMapper objectMapper;

    public AnalysisService(GeminiService geminiService, FinnhubService finnhubService) {
        this.geminiService = geminiService;
        this.finnhubService = finnhubService;
        this.objectMapper = new ObjectMapper();
    }

    public Object analyzeStock(String symbol) {
        log.info("Generating AI analysis for symbol: {}", symbol);
        
        // 1. Fetch real market data
        Object quoteData = finnhubService.getQuote(symbol);
        
        // 2. Construct the prompt
        String prompt = String.format(
            "Act as an expert financial analyst. Analyze the stock symbol %s based on this recent market data: %s. " +
            "Provide a comprehensive AI insight in JSON format. Ensure the response is valid, parsable JSON without markdown blocks (no ```json). " +
            "Include exactly these fields: " +
            "symbol (string), companyName (string), summary (string), businessOverview (string), growthPotential (string), " +
            "financialHealth (string), fundamentalAnalysis (string), technicalAnalysis (string), pros (array of strings), " +
            "cons (array of strings), riskScore (number 0-100), confidenceScore (number 0-100), " +
            "recommendation (one of: 'Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell'), targetPrice (number), futureOutlook (string).",
            symbol.toUpperCase(), quoteData.toString()
        );

        // 3. Get response from Gemini
        String jsonResponse = geminiService.generateAnalysis(prompt);
        
        // Clean up possible markdown code blocks if the model includes them despite instructions
        if (jsonResponse.startsWith("```json")) {
            jsonResponse = jsonResponse.replace("```json", "").replace("```", "").trim();
        }

        // 4. Parse and return as an object
        try {
            return objectMapper.readValue(jsonResponse, Map.class);
        } catch (Exception e) {
            log.error("Failed to parse Gemini response as JSON: {}", jsonResponse, e);
            // Return raw string or handle error
            return Map.of("error", "Failed to parse AI response", "raw", jsonResponse);
        }
    }
}
