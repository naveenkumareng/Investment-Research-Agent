import type { WatchlistItem } from "@/types";
import { finnhubStocksService } from "./finnhub-stocks-service";

const STORAGE_KEY = "investment_dashboard_watchlist";

/**
 * Watchlist Service - Persistent local storage with real-time prices
 *
 * Stores watchlist in localStorage
 * Fetches real prices from Finnhub
 *
 * Production: Replace with backend API calls
 */
export const watchlistService = {
  /**
   * Get all watchlist items with current prices
   */
  async list(): Promise<WatchlistItem[]> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let items: WatchlistItem[] = stored ? JSON.parse(stored) : [];

      // Fetch current prices for all items
      const updated = await Promise.all(
        items.map(async (item) => {
          const stock = await finnhubStocksService.getQuote(item.symbol);
          if (stock) {
            return {
              ...item,
              price: stock.price,
              change: stock.change,
              changePercent: stock.changePercent,
            };
          }
          return item;
        }),
      );

      return updated;
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      // Return stored items even if price fetch fails
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    }
  },

  /**
   * Add symbol to watchlist
   */
  async add(symbol: string): Promise<WatchlistItem> {
    try {
      const upperSymbol = symbol.toUpperCase().trim();

      // Fetch stock data to verify it exists
      const stock = await finnhubStocksService.getQuote(upperSymbol);
      if (!stock) {
        throw new Error(`Symbol ${symbol} not found`);
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      const items: WatchlistItem[] = stored ? JSON.parse(stored) : [];

      // Check if already exists
      const existing = items.find((i) => i.symbol === upperSymbol);
      if (existing) {
        return existing;
      }

      // Create new watchlist item
      const created: WatchlistItem = {
        id: "w-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
        symbol: upperSymbol,
        name: stock.name,
        price: stock.price,
        change: stock.change,
        changePercent: stock.changePercent,
        addedAt: new Date().toISOString(),
      };

      items.unshift(created);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

      return created;
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      throw error;
    }
  },

  /**
   * Remove symbol from watchlist
   */
  async remove(symbol: string): Promise<{ ok: true } | null> {
    try {
      const upperSymbol = symbol.toUpperCase().trim();
      const stored = localStorage.getItem(STORAGE_KEY);
      const items = stored ? JSON.parse(stored) : [];

      const filtered = items.filter((i: WatchlistItem) => i.symbol !== upperSymbol);

      if (filtered.length === items.length) {
        // Symbol not found
        return null;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return { ok: true };
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      return null;
    }
  },

  /**
   * Check if symbol is in watchlist
   */
  async isInWatchlist(symbol: string): Promise<boolean> {
    try {
      const items = await this.list();
      return items.some((i) => i.symbol === symbol.toUpperCase());
    } catch (error) {
      console.error("Error checking watchlist:", error);
      return false;
    }
  },

  /**
   * Get watchlist count
   */
  async getCount(): Promise<number> {
    try {
      const items = await this.list();
      return items.length;
    } catch (error) {
      console.error("Error getting watchlist count:", error);
      return 0;
    }
  },

  /**
   * Clear entire watchlist
   */
  async clear(): Promise<{ ok: true }> {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return { ok: true };
    } catch (error) {
      console.error("Error clearing watchlist:", error);
      throw error;
    }
  },

  /**
   * Get best performers in watchlist
   */
  async getTopGainers(limit: number = 5): Promise<WatchlistItem[]> {
    try {
      const items = await this.list();
      return items.sort((a, b) => b.changePercent - a.changePercent).slice(0, limit);
    } catch (error) {
      console.error("Error getting top gainers:", error);
      return [];
    }
  },

  /**
   * Get worst performers in watchlist
   */
  async getTopLosers(limit: number = 5): Promise<WatchlistItem[]> {
    try {
      const items = await this.list();
      return items.sort((a, b) => a.changePercent - b.changePercent).slice(0, limit);
    } catch (error) {
      console.error("Error getting top losers:", error);
      return [];
    }
  },
};
