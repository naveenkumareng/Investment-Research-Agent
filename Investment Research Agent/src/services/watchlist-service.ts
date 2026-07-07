import { MOCK_WATCHLIST, MOCK_STOCKS } from "./mock-data";
import type { WatchlistItem } from "@/types";

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
    await delay(150);
    return items;
  },
  async add(symbol: string): Promise<WatchlistItem> {
    await delay(150);
    const stock = MOCK_STOCKS.find((s) => s.symbol === symbol.toUpperCase());
    if (!stock) throw new Error("Symbol not found");
    if (items.some((i) => i.symbol === stock.symbol))
      return items.find((i) => i.symbol === stock.symbol)!;
    const created: WatchlistItem = {
      id: "w-" + Math.random().toString(36).slice(2, 8),
      symbol: stock.symbol,
      name: stock.name,
      price: stock.price,
      change: stock.change,
      changePercent: stock.changePercent,
      addedAt: new Date().toISOString(),
    };
    items = [created, ...items];
    return created;
  },
  async remove(symbol: string): Promise<{ ok: true }> {
    await delay(120);
    items = items.filter((i) => i.symbol !== symbol);
    return { ok: true };
  },
};
