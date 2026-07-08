package com.investa.service;

import com.investa.dto.FinnhubQuoteDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class FinnhubService {

    private final RestTemplate restTemplate;

    @Value("${api.finnhub.key}")
    private String finnhubApiKey;

    @Value("${api.finnhub.base-url}")
    private String finnhubBaseUrl;

    public FinnhubService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public FinnhubQuoteDTO getQuote(String symbol) {
        String url = finnhubBaseUrl + "/quote?symbol=" + symbol + "&token=" + finnhubApiKey;
        return restTemplate.getForObject(url, FinnhubQuoteDTO.class);
    }
}
