package com.investa.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class NewsResponseDTO {
    private String status;
    private Integer totalResults;
    private List<NewsArticleDTO> articles;
}
