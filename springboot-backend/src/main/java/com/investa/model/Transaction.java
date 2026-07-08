package com.investa.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "transactions")
public class Transaction {
    @Id
    private String id;
    private String userId;
    private String symbol;
    private String type; // "BUY" or "SELL"
    private Double quantity;
    private Double price;
    private Double totalAmount;
    private LocalDateTime timestamp;
}
