import { MOCK_STOCKS, MOCK_INDICES, generateChartData } from "./mock-data";
import type { Stock, MarketIndex, TimeRange, PricePoint } from "@/types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Create a deep copy of MOCK_STOCKS so we can mutate it for simulation
let liveStocks: Stock[] = JSON.parse(JSON.stringify(MOCK_STOCKS));
let liveIndices: MarketIndex[] = JSON.parse(JSON.stringify(MOCK_INDICES));

// Simulate live market fluctuations every 3 seconds
setInterval(() => {
  liveStocks = liveStocks.map(stock => {
    // Random volatility between -0.4% and +0.4%
    const volatility = (Math.random() - 0.5) * 0.008; 
    const newPrice = stock.price * (1 + volatility);
    const newChange = newPrice - stock.previousClose;
    const newChangePercent = (newChange / stock.previousClose) * 100;
    
    return {
      ...stock,
      price: newPrice,
      change: newChange,
      changePercent: newChangePercent,
      dayHigh: Math.max(stock.dayHigh, newPrice),
      dayLow: Math.min(stock.dayLow, newPrice),
    };
  });

  liveIndices = liveIndices.map(index => {
    // Indices are less volatile
    const volatility = (Math.random() - 0.5) * 0.004; 
    const newValue = index.value * (1 + volatility);
    // Rough approximation of previous close for indices
    const previousClose = index.value - index.change;
    const newChange = newValue - previousClose; 
    return {
      ...index,
      value: newValue,
      change: newChange,
      changePercent: (newChange / previousClose) * 100,
    };
  });
}, 3000);

export const stocksService = {
  async list(): Promise<Stock[]> {
    return liveStocks;
  },
  async search(query: string): Promise<Stock[]> {
    const q = query.trim().toLowerCase();
    if (!q) return liveStocks;
    return liveStocks.filter(
      (s) =>
        s.symbol.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.sector.toLowerCase().includes(q) ||
        s.industry.toLowerCase().includes(q),
    );
  },
  async get(symbol: string): Promise<Stock> {
    const found = liveStocks.find((s) => s.symbol === symbol.toUpperCase());
    if (!found) throw new Error(`Stock ${symbol} not found`);
    return found;
  },
  async chart(symbol: string, range: TimeRange): Promise<PricePoint[]> {
    await delay(200);
    return generateChartData(symbol.toUpperCase(), range);
  },
  async indices(): Promise<MarketIndex[]> {
    return liveIndices;
  },
  async topGainers(): Promise<Stock[]> {
    return [...liveStocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  },
  async topLosers(): Promise<Stock[]> {
    return [...liveStocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
  },
  async trending(): Promise<Stock[]> {
    return [...liveStocks].sort((a, b) => b.volume - a.volume).slice(0, 6);
  },
};
