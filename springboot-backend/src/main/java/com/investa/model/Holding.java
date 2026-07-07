package com.investa.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Portfolio Holding - MongoDB Document
 * Represents a stock holding in a user's portfolio
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "holdings")
public class Holding {
    
    @Id
    private String mongoId;
    
    @Indexed
    private String userId;
    
    @Indexed
    private String id;
    
    @Indexed(unique = false)
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
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    /**
     * Compound index: userId + symbol for efficient queries
     */
    @Indexed(unique = false)
    private String userSymbolIdx;
    
    public void setUserSymbolIdx() {
        this.userSymbolIdx = this.userId + "_" + this.symbol;
    }
}
