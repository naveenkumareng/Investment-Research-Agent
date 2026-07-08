package com.investa.service;

import com.investa.dto.NewsResponseDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class NewsService {

    private final RestTemplate restTemplate;

    @Value("${api.newsapi.key}")
    private String newsApiKey;

    @Value("${api.newsapi.base-url}")
    private String newsApiBaseUrl;

    public NewsService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public NewsResponseDTO getMarketNews(String query) {
        String url = newsApiBaseUrl + "/everything?q=" + query + "&sortBy=publishedAt&apiKey=" + newsApiKey;
        return restTemplate.getForObject(url, NewsResponseDTO.class);
    }
}
