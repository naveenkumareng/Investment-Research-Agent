import { buildAIInsight, MOCK_STOCKS } from "./mock-data";
import type { AIInsight } from "@/types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * TODO: Replace with Spring Boot endpoints:
 *   POST /api/ai/analyze  { query }  -> AIInsight
 */
export const aiService = {
  async analyze(query: string): Promise<AIInsight> {
    await delay(900);
    const upper = query.toUpperCase();
    const match =
      MOCK_STOCKS.find((s) => upper.includes(s.symbol)) ??
      MOCK_STOCKS.find((s) => query.toLowerCase().includes(s.name.split(" ")[0].toLowerCase())) ??
      MOCK_STOCKS[0];
    return buildAIInsight(match.symbol);
  },
};
