import { apiClient } from "@/lib/api-client";
import type { NewsArticle } from "@/types";

export const newsService = {
  async list(category?: NewsArticle["category"] | "all", query?: string): Promise<NewsArticle[]> {
    try {
      let q = query || "finance OR market OR stocks";
      if (category && category !== "all") {
        q = `${category} AND (${q})`;
      }
      
      const response = await apiClient.get(`/market/news`, {
        params: { query: q }
      });
      
      // Map backend DTO to frontend type
      return (response.data?.articles || []).map((article: any, index: number) => ({
        id: `news-${index}-${Date.now()}`,
        title: article.title,
        summary: article.description || "",
        source: article.source?.name || "Unknown",
        category: category !== "all" && category ? category : "finance",
        imageUrl: article.urlToImage,
        url: article.url,
        publishedAt: article.publishedAt,
      }));
    } catch (error) {
      console.error("Failed to fetch news:", error);
      return [];
    }
  },
};
