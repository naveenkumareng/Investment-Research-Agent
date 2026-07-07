package com.investa.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Holding Data Transfer Object
 * Used for API requests/responses
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HoldingDTO {
    private String id;
    private String symbol;
    private String name;
    private Integer quantity;
    private Double avgPrice;
    private String purchaseDate;
    private String broker;
    private Double currentPrice;
    private Double invested;
    private Double currentValue;
    private Double pnl;
    private Double pnlPercent;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
