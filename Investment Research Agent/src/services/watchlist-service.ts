import { MOCK_WATCHLIST, MOCK_STOCKS } from "./mock-data";
import type { WatchlistItem } from "@/types";
import { apiClient } from "@/lib/api-client";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
let items = [...MOCK_WATCHLIST];

/**
 * TODO: Replace with Spring Boot endpoints:
 *   GET    /api/watchlist
 *   POST   /api/watchlist   { symbol }
 *   DELETE /api/watchlist/{symbol}
 */
export const watchlistService = {
  async list(): Promise<WatchlistItem[]> {
    try {
      const response = await apiClient.get(`/watchlist/default-user`);
      return response.data;
    } catch (error) {
      console.warn("Failed to fetch watchlist:", error);
      return [];
    }
  },
  async add(symbol: string): Promise<WatchlistItem> {
    const stock = MOCK_STOCKS.find((s) => s.symbol === symbol.toUpperCase());
    if (!stock) throw new Error("Symbol not found");
    
    try {
      const response = await apiClient.post(`/watchlist/default-user/${stock.symbol}?name=${encodeURIComponent(stock.name)}`);
      return response.data;
    } catch (error) {
      console.error("Failed to add to watchlist:", error);
      throw error;
    }
  },
  async remove(symbol: string): Promise<{ ok: true }> {
    try {
      await apiClient.delete(`/watchlist/default-user/${symbol.toUpperCase()}`);
    } catch (error) {
      console.error("Failed to remove from watchlist:", error);
    }
    return { ok: true };
  },
};
