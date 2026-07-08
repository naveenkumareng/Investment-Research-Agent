package com.investa.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class FinnhubQuoteDTO {
    @JsonProperty("c")
    private Double currentPrice;

    @JsonProperty("d")
    private Double change;

    @JsonProperty("dp")
    private Double percentChange;

    @JsonProperty("h")
    private Double highPrice;

    @JsonProperty("l")
    private Double lowPrice;

    @JsonProperty("o")
    private Double openPrice;

    @JsonProperty("pc")
    private Double previousClose;
}
