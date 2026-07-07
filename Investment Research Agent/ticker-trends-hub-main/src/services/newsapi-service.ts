import { newsApiClient, handleApiError, retryRequest } from "@/lib/external-apis";
import type { NewsArticle } from "@/types";

interface NewsApiArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
}

/**
 * NewsAPI Service - Real financial and market news
 *
 * Free tier: 100 requests/day
 *
 * Provides:
 * - Real-time financial news
 * - Sector-specific articles
 * - Stock-specific news
 * - News search and filtering
 */
export const newsApiService = {
  /**
   * Search for news articles
   */
  async search(
    query: string,
    category?: NewsArticle["category"],
    limit: number = 20,
  ): Promise<NewsArticle[]> {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }

      let searchQuery = query.trim();

      // Add category modifiers to improve results
      if (category && category !== "all" && category !== "business") {
        const categoryKeywords: Record<string, string> = {
          technology: "tech OR technology OR AI OR software",
          crypto: "cryptocurrency OR bitcoin OR ethereum OR blockchain",
          market: "stock market OR stocks OR trading",
          earnings: "earnings OR quarterly OR revenue",
          ipo: 'IPO OR "initial public offering"',
          economy: "economy OR federal reserve OR inflation",
          finance: "finance OR financial OR stocks",
          india: "India OR Indian OR NSE OR BSE",
          global: "global OR international OR world",
        };

        searchQuery = `${searchQuery} ${categoryKeywords[category] || ""}`;
      }

      const response = await retryRequest(
        () =>
          newsApiClient.get<NewsApiResponse>("/everything", {
            params: {
              q: searchQuery,
              sortBy: "publishedAt",
              language: "en",
              pageSize: limit,
              from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            },
          }),
        2,
        500,
      );

      if (response.data.status !== "ok") {
        console.warn("NewsAPI returned non-ok status:", response.data.status);
        return [];
      }

      return (response.data.articles || [])
        .filter((article) => article.title && article.description)
        .map((article) => ({
          id: article.url,
          title: article.title,
          summary: article.description || "",
          content: article.content || article.description || "",
          source: article.source.name,
          sourceUrl: article.url,
          category: categorizeArticle(article.title, searchQuery),
          imageUrl: article.urlToImage,
          url: article.url,
          publishedAt: article.publishedAt,
          author: article.author,
          sentiment: detectSentiment(article.title + " " + (article.description || "")),
          symbols: extractSymbols(article.title + " " + article.description),
        }));
    } catch (error) {
      const apiError = handleApiError(error);
      console.error("Error searching news:", apiError);
      return [];
    }
  },

  /**
   * Get financial news headlines
   */
  async getHeadlines(
    category: NewsArticle["category"] = "business",
    limit: number = 15,
  ): Promise<NewsArticle[]> {
    try {
      const queries: Record<string, string> = {
        business: "stock market business earnings",
        technology: "tech companies technology stocks software AI",
        crypto: "cryptocurrency bitcoin ethereum blockchain",
        market: "stock market economy finance trading",
        earnings: "earnings report quarterly results revenue",
        ipo: "IPO initial public offering new listings",
        economy: "economy federal reserve inflation interest rates",
        finance: "finance financial stocks investment banking",
        india: "India stocks market NSE BSE rupee",
        global: "global stocks international markets forex",
      };

      const query = queries[category] || queries.business;

      const response = await retryRequest(
        () =>
          newsApiClient.get<NewsApiResponse>("/everything", {
            params: {
              q: query,
              sortBy: "publishedAt",
              language: "en",
              pageSize: limit,
              from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            },
          }),
        2,
        500,
      );

      if (response.data.status !== "ok") {
        return [];
      }

      return (response.data.articles || [])
        .filter((article) => article.title && article.description)
        .map((article) => ({
          id: article.url,
          title: article.title,
          summary: article.description || "",
          content: article.content || article.description || "",
          source: article.source.name,
          sourceUrl: article.url,
          category,
          imageUrl: article.urlToImage,
          url: article.url,
          publishedAt: article.publishedAt,
          author: article.author,
          sentiment: detectSentiment(article.title + " " + (article.description || "")),
          symbols: extractSymbols(article.title + " " + article.description),
        }));
    } catch (error) {
      const apiError = handleApiError(error);
      console.error(`Error fetching ${category} headlines:`, apiError);
      return [];
    }
  },

  /**
   * Get news specific to a stock symbol
   */
  async getStockNews(symbol: string, limit: number = 10): Promise<NewsArticle[]> {
    try {
      const response = await retryRequest(
        () =>
          newsApiClient.get<NewsApiResponse>("/everything", {
            params: {
              q: symbol,
              sortBy: "publishedAt",
              language: "en",
              pageSize: limit,
              from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            },
          }),
        2,
        500,
      );

      if (response.data.status !== "ok") {
        return [];
      }

      return (response.data.articles || [])
        .filter((article) => article.title && article.description)
        .map((article) => ({
          id: article.url,
          title: article.title,
          summary: article.description || "",
          content: article.content || article.description || "",
          source: article.source.name,
          sourceUrl: article.url,
          category: "business",
          imageUrl: article.urlToImage,
          url: article.url,
          publishedAt: article.publishedAt,
          author: article.author,
          sentiment: detectSentiment(article.title + " " + (article.description || "")),
          symbols: [
            symbol,
            ...extractSymbols(article.title + " " + article.description).filter(
              (s) => s !== symbol,
            ),
          ],
        }));
    } catch (error) {
      const apiError = handleApiError(error);
      console.error(`Error fetching news for ${symbol}:`, apiError);
      return [];
    }
  },

  /**
   * Get trending financial topics
   */
  async getTrending(limit: number = 20): Promise<NewsArticle[]> {
    try {
      const response = await retryRequest(
        () =>
          newsApiClient.get<NewsApiResponse>("/everything", {
            params: {
              q: "stock market stocks trading economy",
              sortBy: "popularity",
              language: "en",
              pageSize: limit,
              from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            },
          }),
        2,
        500,
      );

      if (response.data.status !== "ok") {
        return [];
      }

      return (response.data.articles || [])
        .filter((article) => article.title && article.description)
        .map((article) => ({
          id: article.url,
          title: article.title,
          summary: article.description || "",
          content: article.content || article.description || "",
          source: article.source.name,
          sourceUrl: article.url,
          category: "market",
          imageUrl: article.urlToImage,
          url: article.url,
          publishedAt: article.publishedAt,
          author: article.author,
          sentiment: detectSentiment(article.title + " " + (article.description || "")),
          symbols: extractSymbols(article.title + " " + article.description),
        }));
    } catch (error) {
      const apiError = handleApiError(error);
      console.error("Error fetching trending news:", apiError);
      return [];
    }
  },
};

/**
 * Categorize article based on title and content
 */
function categorizeArticle(title: string, query: string): NewsArticle["category"] {
  const lower = title.toLowerCase();
  const queryLower = query.toLowerCase();

  if (
    lower.includes("crypto") ||
    lower.includes("bitcoin") ||
    lower.includes("ethereum") ||
    lower.includes("blockchain")
  ) {
    return "crypto";
  }
  if (
    lower.includes("tech") ||
    lower.includes("software") ||
    lower.includes("ai") ||
    lower.includes("apple") ||
    lower.includes("microsoft")
  ) {
    return "technology";
  }
  if (lower.includes("ipo") || lower.includes("offering")) {
    return "ipo";
  }
  if (
    lower.includes("earnings") ||
    lower.includes("profit") ||
    lower.includes("revenue") ||
    lower.includes("quarterly")
  ) {
    return "earnings";
  }
  if (
    lower.includes("india") ||
    lower.includes("nse") ||
    lower.includes("bse") ||
    lower.includes("sensex")
  ) {
    return "india";
  }
  if (
    lower.includes("economy") ||
    lower.includes("federal reserve") ||
    lower.includes("inflation") ||
    lower.includes("gdp")
  ) {
    return "economy";
  }
  if (lower.includes("forex") || lower.includes("currency")) {
    return "global";
  }

  return "business";
}

/**
 * Detect sentiment from text
 */
function detectSentiment(text: string): "positive" | "negative" | "neutral" {
  const lower = text.toLowerCase();

  const positiveWords = [
    "strong",
    "surge",
    "rally",
    "bull",
    "bullish",
    "growth",
    "positive",
    "outperform",
    "excellent",
    "good",
    "rise",
    "gain",
    "up",
    "profit",
    "gain",
  ];
  const negativeWords = [
    "weak",
    "decline",
    "fall",
    "bear",
    "bearish",
    "loss",
    "negative",
    "underperform",
    "poor",
    "bad",
    "drop",
    "crash",
    "down",
    "loss",
    "plunge",
  ];

  const positiveCount = positiveWords.filter((w) => lower.includes(w)).length;
  const negativeCount = negativeWords.filter((w) => lower.includes(w)).length;

  if (positiveCount > negativeCount) return "positive";
  if (negativeCount > positiveCount) return "negative";
  return "neutral";
}

/**
 * Extract stock symbols from text (simple heuristic)
 */
function extractSymbols(text: string): string[] {
  // Find all 1-5 letter uppercase sequences that could be stock symbols
  const matches = text.match(/\b([A-Z]{1,5})\b/g) || [];

  // Filter out common words that aren't stock symbols
  const commonWords = new Set([
    "THE",
    "AND",
    "FOR",
    "WITH",
    "FROM",
    "THAT",
    "THIS",
    "WHICH",
    "THEIR",
    "HAVE",
    "THAN",
    "WOULD",
    "COULD",
    "ABOUT",
    "MORE",
    "YEAR",
  ]);

  return Array.from(new Set(matches.filter((m) => !commonWords.has(m)))).slice(0, 3);
}
