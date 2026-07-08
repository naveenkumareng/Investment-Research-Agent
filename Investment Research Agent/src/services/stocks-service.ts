import { MOCK_STOCKS, MOCK_INDICES, generateChartData } from "./mock-data";
import type { Stock, MarketIndex, TimeRange, PricePoint } from "@/types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * TODO: Replace with Spring Boot endpoints:
 *   GET /api/stocks?query=...
 *   GET /api/stocks/{symbol}
 *   GET /api/stocks/{symbol}/chart?range=1M
 *   GET /api/market/indices
 *   GET /api/market/movers
 */
export const stocksService = {
  async list(): Promise<Stock[]> {
    await delay(150);
    return MOCK_STOCKS;
  },
  async search(query: string): Promise<Stock[]> {
    await delay(120);
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_STOCKS;
    return MOCK_STOCKS.filter(
      (s) =>
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.sector.toLowerCase().includes(q) ||
        s.industry.toLowerCase().includes(q),
    );
  },
  async get(symbol: string): Promise<Stock> {
    const found = MOCK_STOCKS.find((s) => s.symbol === symbol.toUpperCase());
    if (!found) throw new Error(`Stock ${symbol} not found`);

    try {
      const response = await import("@/lib/api-client").then(m => m.apiClient.get(`/market/quote/${symbol}`));
      const quote = response.data;
      if (quote) {
        return {
          ...found,
          price: quote.currentPrice || found.price,
          change: quote.change || found.change,
          changePercent: quote.percentChange || found.changePercent,
          open: quote.openPrice || found.open,
          previousClose: quote.previousClose || found.previousClose,
          dayHigh: quote.highPrice || found.dayHigh,
          dayLow: quote.lowPrice || found.dayLow,
        };
      }
    } catch (error) {
      console.warn("Failed to fetch live quote, using mock data:", error);
    }
    
    return found;
  },
  async chart(symbol: string, range: TimeRange): Promise<PricePoint[]> {
    await delay(200);
    return generateChartData(symbol.toUpperCase(), range);
  },
  async indices(): Promise<MarketIndex[]> {
    await delay(120);
    return MOCK_INDICES;
  },
  async topGainers(): Promise<Stock[]> {
    await delay(120);
    return [...MOCK_STOCKS].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  },
  async topLosers(): Promise<Stock[]> {
    await delay(120);
    return [...MOCK_STOCKS].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
  },
  async trending(): Promise<Stock[]> {
    await delay(120);
    return [...MOCK_STOCKS].sort((a, b) => b.volume - a.volume).slice(0, 6);
  },
};
