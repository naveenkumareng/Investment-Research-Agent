import { MOCK_ACTIVITY } from "./mock-data";
import { getPortfolioHoldings, addHolding, removeHolding } from "./db/portfolio-db-mongodb";
import type { Holding, Activity } from "@/types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Portfolio Service with MongoDB persistence
 * - Holdings are stored in MongoDB and persist across page refreshes
 * - Charts (Holdings table, Allocation pie chart) maintain state
 * - No mock data used - all holdings are user-added
 * - Automatic fallback to localStorage if backend unavailable
 *
 * Future: Expand to include:
 *   - Activity tracking
 *   - Historical performance
 *   - Export/import functionality
 *   - Bulk operations
 */
export const portfolioService = {
  async holdings(): Promise<Holding[]> {
    await delay(180);
    // Load from MongoDB backend (with localStorage fallback)
    return getPortfolioHoldings();
  },
  async add(
    input: Omit<Holding, "id" | "invested" | "currentValue" | "pnl" | "pnlPercent">,
  ): Promise<Holding> {
    await delay(220);
    const invested = input.quantity * input.avgPrice;
    const currentValue = input.quantity * input.currentPrice;
    const pnl = currentValue - invested;
    const pnlPercent = (pnl / invested) * 100;
    const created: Holding = {
      ...input,
      id: "h-" + Math.random().toString(36).slice(2, 8),
      invested,
      currentValue,
      pnl,
      pnlPercent,
    };
    // Persist to MongoDB (with localStorage fallback)
    return addHolding(created);
  },
  async remove(id: string): Promise<{ ok: true }> {
    await delay(120);
    await removeHolding(id);
    return { ok: true };
  },
  async activity(): Promise<Activity[]> {
    await delay(120);
    return MOCK_ACTIVITY;
  },
};
