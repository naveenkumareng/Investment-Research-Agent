package com.investa.controller;

import com.investa.service.AnalysisService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analysis")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AnalysisController {

    private final AnalysisService analysisService;

    public AnalysisController(AnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @GetMapping("/{symbol}")
    public ResponseEntity<Object> getStockAnalysis(@PathVariable String symbol) {
        return ResponseEntity.ok(analysisService.analyzeStock(symbol));
    }
}
