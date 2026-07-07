import type { Holding, Activity } from "@/types";
import { finnhubStocksService } from "./finnhub-stocks-service";

const STORAGE_KEYS = {
  HOLDINGS: "investment_dashboard_holdings",
  ACTIVITY: "investment_dashboard_activity",
};

/**
 * Portfolio Service - Persistent local storage with real price updates
 *
 * Stores portfolio holdings and activity in localStorage
 * Fetches real prices from Finnhub
 *
 * Production: Replace with backend API calls
 */
export const portfolioService = {
  /**
   * Get all holdings with current prices
   */
  async holdings(): Promise<Holding[]> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HOLDINGS);
      let holdings: Holding[] = stored ? JSON.parse(stored) : [];

      // Fetch current prices for all holdings
      const updated = await Promise.all(
        holdings.map(async (holding) => {
          const stock = await finnhubStocksService.getQuote(holding.symbol);
          if (stock) {
            const currentPrice = stock.price;
            const currentValue = holding.quantity * currentPrice;
            const pnl = currentValue - holding.invested;
            const pnlPercent = (pnl / holding.invested) * 100;

            return {
              ...holding,
              currentPrice,
              currentValue,
              pnl,
              pnlPercent,
            };
          }
          return holding;
        }),
      );

      return updated;
    } catch (error) {
      console.error("Error fetching holdings:", error);
      return [];
    }
  },

  /**
   * Add new holding to portfolio
   */
  async add(
    input: Omit<Holding, "id" | "invested" | "currentValue" | "pnl" | "pnlPercent">,
  ): Promise<Holding> {
    try {
      // Get current stock price
      const stock = await finnhubStocksService.getQuote(input.symbol);
      if (!stock) {
        throw new Error(`Could not fetch price for ${input.symbol}`);
      }

      const invested = input.quantity * input.avgPrice;
      const currentPrice = stock.price;
      const currentValue = input.quantity * currentPrice;
      const pnl = currentValue - invested;
      const pnlPercent = (pnl / invested) * 100;

      const created: Holding = {
        ...input,
        id: "h-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
        invested,
        currentValue,
        pnl,
        pnlPercent,
      };

      // Get existing holdings
      const stored = localStorage.getItem(STORAGE_KEYS.HOLDINGS);
      const holdings = stored ? JSON.parse(stored) : [];

      // Add new holding
      holdings.unshift(created);
      localStorage.setItem(STORAGE_KEYS.HOLDINGS, JSON.stringify(holdings));

      // Log activity
      await addActivity({
        type: "buy",
        symbol: input.symbol,
        description: `Bought ${input.quantity} shares of ${input.symbol} at $${input.avgPrice.toFixed(2)}`,
        amount: invested,
      });

      return created;
    } catch (error) {
      console.error("Error adding holding:", error);
      throw error;
    }
  },

  /**
   * Update holding
   */
  async update(
    id: string,
    updates: Partial<Omit<Holding, "id" | "invested" | "currentValue" | "pnl" | "pnlPercent">>,
  ): Promise<Holding | null> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HOLDINGS);
      const holdings: Holding[] = stored ? JSON.parse(stored) : [];

      const index = holdings.findIndex((h) => h.id === id);
      if (index === -1) return null;

      const holding = holdings[index];
      const updated = {
        ...holding,
        ...updates,
      };

      // Recalculate P&L
      if (updates.currentPrice) {
        updated.currentValue = updated.quantity * updated.currentPrice;
        updated.pnl = updated.currentValue - updated.invested;
        updated.pnlPercent = (updated.pnl / updated.invested) * 100;
      }

      holdings[index] = updated;
      localStorage.setItem(STORAGE_KEYS.HOLDINGS, JSON.stringify(holdings));

      return updated;
    } catch (error) {
      console.error("Error updating holding:", error);
      return null;
    }
  },

  /**
   * Remove holding from portfolio
   */
  async remove(id: string): Promise<{ ok: true } | null> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HOLDINGS);
      const holdings = stored ? JSON.parse(stored) : [];

      const holding = holdings.find((h: Holding) => h.id === id);
      if (!holding) return null;

      const filtered = holdings.filter((h: Holding) => h.id !== id);
      localStorage.setItem(STORAGE_KEYS.HOLDINGS, JSON.stringify(filtered));

      // Log activity
      await addActivity({
        type: "sell",
        symbol: holding.symbol,
        description: `Sold ${holding.quantity} shares of ${holding.symbol}`,
        amount: holding.currentValue,
      });

      return { ok: true };
    } catch (error) {
      console.error("Error removing holding:", error);
      return null;
    }
  },

  /**
   * Get activity history
   */
  async activity(): Promise<Activity[]> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error fetching activity:", error);
      return [];
    }
  },

  /**
   * Get portfolio summary
   */
  async getSummary(): Promise<{
    totalInvested: number;
    totalCurrentValue: number;
    totalPnl: number;
    totalPnlPercent: number;
    holdingCount: number;
  }> {
    try {
      const holdings = await this.holdings();

      const totalInvested = holdings.reduce((sum, h) => sum + h.invested, 0);
      const totalCurrentValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
      const totalPnl = totalCurrentValue - totalInvested;
      const totalPnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

      return {
        totalInvested,
        totalCurrentValue,
        totalPnl,
        totalPnlPercent,
        holdingCount: holdings.length,
      };
    } catch (error) {
      console.error("Error calculating portfolio summary:", error);
      return {
        totalInvested: 0,
        totalCurrentValue: 0,
        totalPnl: 0,
        totalPnlPercent: 0,
        holdingCount: 0,
      };
    }
  },
};

/**
 * Add activity log entry
 */
async function addActivity(activity: Omit<Activity, "id" | "timestamp">): Promise<void> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    const activities = stored ? JSON.parse(stored) : [];

    const newActivity: Activity = {
      ...activity,
      id: "a-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      timestamp: new Date().toISOString(),
    };

    activities.unshift(newActivity);

    // Keep only last 100 activities
    if (activities.length > 100) {
      activities.pop();
    }

    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(activities));
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}
