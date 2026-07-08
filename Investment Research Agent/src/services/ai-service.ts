import { apiClient } from "@/lib/api-client";
import { buildAIInsight, MOCK_STOCKS } from "./mock-data";
import type { AIInsight } from "@/types";

export const aiService = {
  async analyze(query: string): Promise<AIInsight> {
    const upper = query.toUpperCase();
    const match =
      MOCK_STOCKS.find((s) => upper.includes(s.symbol)) ??
      MOCK_STOCKS.find((s) => query.toLowerCase().includes(s.name.split(" ")[0].toLowerCase())) ??
      MOCK_STOCKS[0];

    try {
      const response = await apiClient.get(`/analysis/${match.symbol}`);
      return response.data;
    } catch (error) {
      console.error("AI Analysis failed, falling back to mock:", error);
      return buildAIInsight(match.symbol);
    }
  },
};
