export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "user" | "admin";
  createdAt: string;
}

export interface AuthSession {
  token: string;
  refreshToken: string;
  user: User;
}

export interface Stock {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  weekHigh52: number;
  weekLow52: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  peRatio: number;
  eps: number;
  dividend: number;
  dividendYield: number;
  beta: number;
  currency: string;
  logo?: string;
  ceo?: string;
  employees?: number;
  website?: string;
  description?: string;
}

export interface PricePoint {
  time: string;
  price: number;
  volume?: number;
}

export type TimeRange = "1D" | "1W" | "1M" | "6M" | "1Y" | "5Y" | "MAX";

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  purchaseDate: string;
  broker: string;
  currentPrice: number;
  invested: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  addedAt: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: "business" | "technology" | "economy" | "finance" | "crypto" | "india" | "global";
  imageUrl?: string;
  url: string;
  publishedAt: string;
  symbols?: string[];
  sentiment?: "positive" | "negative" | "neutral";
}

export interface AIInsight {
  symbol: string;
  companyName: string;
  summary: string;
  businessOverview: string;
  growthPotential: string;
  financialHealth: string;
  fundamentalAnalysis: string;
  technicalAnalysis: string;
  pros: string[];
  cons: string[];
  riskScore: number; // 0-100
  confidenceScore: number; // 0-100
  recommendation: "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell";
  targetPrice: number;
  futureOutlook: string;
}

export interface Alert {
  id: string;
  symbol: string;
  type: "price" | "volume" | "ma" | "rsi" | "ema";
  condition: "above" | "below" | "crosses";
  value: number;
  active: boolean;
  createdAt: string;
  triggered?: boolean;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  region: "US" | "IN" | "EU" | "ASIA" | "CRYPTO";
}

export interface Activity {
  id: string;
  type: "buy" | "sell" | "alert" | "watch" | "dividend";
  symbol: string;
  description: string;
  amount?: number;
  timestamp: string;
}
