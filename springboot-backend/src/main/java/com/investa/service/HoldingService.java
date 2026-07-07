package com.investa.service;

import com.investa.dto.HoldingDTO;
import com.investa.model.Holding;
import com.investa.repository.HoldingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for portfolio holding operations
 * Handles business logic for holdings management
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class HoldingService {
    
    private final HoldingRepository holdingRepository;
    
    /**
     * Get all holdings for a user
     */
    public List<HoldingDTO> getUserHoldings(String userId) {
        log.info("Fetching holdings for user: {}", userId);
        return holdingRepository
            .findByUserIdOrderByCreatedAtDesc(userId)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * Get a specific holding by ID
     */
    public Optional<HoldingDTO> getHoldingById(String id, String userId) {
        log.info("Fetching holding: {} for user: {}", id, userId);
        return holdingRepository
            .findByIdAndUserId(id, userId)
            .map(this::convertToDTO);
    }
    
    /**
     * Create a new holding
     */
    public HoldingDTO createHolding(String userId, HoldingDTO holdingDTO) {
        log.info("Creating holding for user: {}", userId);
        
        Holding holding = Holding.builder()
            .userId(userId)
            .id(holdingDTO.getId())
            .symbol(holdingDTO.getSymbol().toUpperCase())
            .name(holdingDTO.getName())
            .quantity(holdingDTO.getQuantity())
            .avgPrice(holdingDTO.getAvgPrice())
            .purchaseDate(holdingDTO.getPurchaseDate())
            .broker(holdingDTO.getBroker())
            .currentPrice(holdingDTO.getCurrentPrice())
            .invested(holdingDTO.getInvested())
            .currentValue(holdingDTO.getCurrentValue())
            .pnl(holdingDTO.getPnl())
            .pnlPercent(holdingDTO.getPnlPercent())
            .build();
        
        holding.setUserSymbolIdx();
        Holding saved = holdingRepository.save(holding);
        
        log.info("Holding created with ID: {}", saved.getId());
        return convertToDTO(saved);
    }
    
    /**
     * Update an existing holding
     */
    public Optional<HoldingDTO> updateHolding(String id, String userId, HoldingDTO holdingDTO) {
        log.info("Updating holding: {} for user: {}", id, userId);
        
        Optional<Holding> existing = holdingRepository.findByIdAndUserId(id, userId);
        
        if (existing.isPresent()) {
            Holding holding = existing.get();
            
            if (holdingDTO.getSymbol() != null) {
                holding.setSymbol(holdingDTO.getSymbol().toUpperCase());
            }
            if (holdingDTO.getName() != null) {
                holding.setName(holdingDTO.getName());
            }
            if (holdingDTO.getQuantity() != null) {
                holding.setQuantity(holdingDTO.getQuantity());
            }
            if (holdingDTO.getAvgPrice() != null) {
                holding.setAvgPrice(holdingDTO.getAvgPrice());
            }
            if (holdingDTO.getCurrentPrice() != null) {
                holding.setCurrentPrice(holdingDTO.getCurrentPrice());
            }
            if (holdingDTO.getInvested() != null) {
                holding.setInvested(holdingDTO.getInvested());
            }
            if (holdingDTO.getCurrentValue() != null) {
                holding.setCurrentValue(holdingDTO.getCurrentValue());
            }
            if (holdingDTO.getPnl() != null) {
                holding.setPnl(holdingDTO.getPnl());
            }
            if (holdingDTO.getPnlPercent() != null) {
                holding.setPnlPercent(holdingDTO.getPnlPercent());
            }
            
            holding.setUserSymbolIdx();
            Holding updated = holdingRepository.save(holding);
            
            log.info("Holding updated: {}", id);
            return Optional.of(convertToDTO(updated));
        }
        
        log.warn("Holding not found: {} for user: {}", id, userId);
        return Optional.empty();
    }
    
    /**
     * Delete a holding
     */
    public boolean deleteHolding(String id, String userId) {
        log.info("Deleting holding: {} for user: {}", id, userId);
        
        Optional<Holding> existing = holdingRepository.findByIdAndUserId(id, userId);
        if (existing.isPresent()) {
            holdingRepository.deleteByIdAndUserId(id, userId);
            log.info("Holding deleted: {}", id);
            return true;
        }
        
        log.warn("Holding not found for deletion: {} user: {}", id, userId);
        return false;
    }
    
    /**
     * Get portfolio statistics
     */
    public PortfolioStats getPortfolioStats(String userId) {
        log.info("Calculating portfolio stats for user: {}", userId);
        
        List<Holding> holdings = holdingRepository.findByUserIdOrderByCreatedAtDesc(userId);
        
        double totalInvested = holdings.stream().mapToDouble(Holding::getInvested).sum();
        double totalValue = holdings.stream().mapToDouble(Holding::getCurrentValue).sum();
        double totalPnl = holdings.stream().mapToDouble(Holding::getPnl).sum();
        double totalPnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
        
        Holding topHolding = holdings.stream()
            .max((h1, h2) -> Double.compare(h1.getCurrentValue(), h2.getCurrentValue()))
            .orElse(null);
        
        return PortfolioStats.builder()
            .totalHoldings(holdings.size())
            .totalInvested(totalInvested)
            .totalValue(totalValue)
            .totalPnl(totalPnl)
            .totalPnlPercent(totalPnlPercent)
            .topHolding(topHolding != null ? convertToDTO(topHolding) : null)
            .build();
    }
    
    /**
     * Convert Holding entity to DTO
     */
    private HoldingDTO convertToDTO(Holding holding) {
        return HoldingDTO.builder()
            .id(holding.getId())
            .symbol(holding.getSymbol())
            .name(holding.getName())
            .quantity(holding.getQuantity())
            .avgPrice(holding.getAvgPrice())
            .purchaseDate(holding.getPurchaseDate())
            .broker(holding.getBroker())
            .currentPrice(holding.getCurrentPrice())
            .invested(holding.getInvested())
            .currentValue(holding.getCurrentValue())
            .pnl(holding.getPnl())
            .pnlPercent(holding.getPnlPercent())
            .createdAt(holding.getCreatedAt())
            .updatedAt(holding.getUpdatedAt())
            .build();
    }
    
    /**
     * Portfolio statistics DTO
     */
    @lombok.Data
    @lombok.Builder
    public static class PortfolioStats {
        private int totalHoldings;
        private double totalInvested;
        private double totalValue;
        private double totalPnl;
        private double totalPnlPercent;
        private HoldingDTO topHolding;
    }
}
