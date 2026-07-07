package com.investa.controller;

import com.investa.dto.HoldingDTO;
import com.investa.service.HoldingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * Portfolio API Controller
 * REST endpoints for portfolio operations
 * Base path: /api/portfolio
 */
@RestController
@RequestMapping("/portfolio")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class PortfolioController {
    
    private final HoldingService holdingService;
    
    /**
     * GET /portfolio/holdings
     * Get all holdings for a user
     */
    @GetMapping("/holdings")
    public ResponseEntity<List<HoldingDTO>> getHoldings(
        @RequestHeader(value = "x-user-id", defaultValue = "default-user") String userId
    ) {
        log.info("GET /holdings for user: {}", userId);
        List<HoldingDTO> holdings = holdingService.getUserHoldings(userId);
        return ResponseEntity.ok(holdings);
    }
    
    /**
     * GET /portfolio/holdings/:id
     * Get a specific holding
     */
    @GetMapping("/holdings/{id}")
    public ResponseEntity<HoldingDTO> getHolding(
        @PathVariable String id,
        @RequestHeader(value = "x-user-id", defaultValue = "default-user") String userId
    ) {
        log.info("GET /holdings/{} for user: {}", id, userId);
        Optional<HoldingDTO> holding = holdingService.getHoldingById(id, userId);
        return holding
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    /**
     * POST /portfolio/holdings
     * Create a new holding
     */
    @PostMapping("/holdings")
    public ResponseEntity<HoldingDTO> createHolding(
        @RequestBody HoldingDTO holdingDTO,
        @RequestHeader(value = "x-user-id", defaultValue = "default-user") String userId
    ) {
        log.info("POST /holdings for user: {} - symbol: {}", userId, holdingDTO.getSymbol());
        HoldingDTO created = holdingService.createHolding(userId, holdingDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    /**
     * PUT /portfolio/holdings/:id
     * Update an existing holding
     */
    @PutMapping("/holdings/{id}")
    public ResponseEntity<HoldingDTO> updateHolding(
        @PathVariable String id,
        @RequestBody HoldingDTO holdingDTO,
        @RequestHeader(value = "x-user-id", defaultValue = "default-user") String userId
    ) {
        log.info("PUT /holdings/{} for user: {}", id, userId);
        Optional<HoldingDTO> updated = holdingService.updateHolding(id, userId, holdingDTO);
        return updated
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    /**
     * DELETE /portfolio/holdings/:id
     * Delete a holding
     */
    @DeleteMapping("/holdings/{id}")
    public ResponseEntity<?> deleteHolding(
        @PathVariable String id,
        @RequestHeader(value = "x-user-id", defaultValue = "default-user") String userId
    ) {
        log.info("DELETE /holdings/{} for user: {}", id, userId);
        boolean deleted = holdingService.deleteHolding(id, userId);
        
        if (deleted) {
            return ResponseEntity.ok().body(new DeleteResponse(true, id));
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * GET /portfolio/stats
     * Get portfolio statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<HoldingService.PortfolioStats> getPortfolioStats(
        @RequestHeader(value = "x-user-id", defaultValue = "default-user") String userId
    ) {
        log.info("GET /stats for user: {}", userId);
        HoldingService.PortfolioStats stats = holdingService.getPortfolioStats(userId);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<HealthResponse> health() {
        return ResponseEntity.ok(new HealthResponse("Portfolio API is running", true));
    }
    
    /**
     * Delete response DTO
     */
    @lombok.Data
    @lombok.AllArgsConstructor
    public static class DeleteResponse {
        private boolean ok;
        private String id;
    }
    
    /**
     * Health response DTO
     */
    @lombok.Data
    @lombok.AllArgsConstructor
    public static class HealthResponse {
        private String message;
        private boolean status;
    }
}
