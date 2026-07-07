import { MOCK_NEWS } from "./mock-data";
import type { NewsArticle } from "@/types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * TODO: Replace with Spring Boot endpoints:
 *   GET /api/news?category=...&q=...
 */
export const newsService = {
  async list(category?: NewsArticle["category"] | "all", query?: string): Promise<NewsArticle[]> {
    await delay(180);
    let out = [...MOCK_NEWS];
    if (category && category !== "all") out = out.filter((n) => n.category === category);
    if (query) {
      const q = query.toLowerCase();
      out = out.filter(
        (n) => n.title.toLowerCase().includes(q) || n.summary.toLowerCase().includes(q),
      );
    }
    return out;
  },
};
