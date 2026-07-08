package com.investa.controller;

import com.investa.dto.FinnhubQuoteDTO;
import com.investa.service.FinnhubService;
import com.investa.service.NewsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/market")
@CrossOrigin(origins = "*", maxAge = 3600)
public class MarketDataController {

    private final FinnhubService finnhubService;
    private final NewsService newsService;

    public MarketDataController(FinnhubService finnhubService, NewsService newsService) {
        this.finnhubService = finnhubService;
        this.newsService = newsService;
    }

    @GetMapping("/quote/{symbol}")
    public ResponseEntity<FinnhubQuoteDTO> getQuote(@PathVariable String symbol) {
        try {
            FinnhubQuoteDTO quote = finnhubService.getQuote(symbol.toUpperCase());
            return ResponseEntity.ok(quote);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/news")
    public ResponseEntity<com.investa.dto.NewsResponseDTO> getNews(@RequestParam(defaultValue = "finance OR stocks OR market") String query) {
        try {
            com.investa.dto.NewsResponseDTO news = newsService.getMarketNews(query);
            return ResponseEntity.ok(news);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
