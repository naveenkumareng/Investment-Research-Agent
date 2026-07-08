package com.investa.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "watchlists")
public class Watchlist {
    @Id
    private String id;
    private String userId;
    private String symbol;
    private String name;
    private LocalDateTime addedAt;
}
