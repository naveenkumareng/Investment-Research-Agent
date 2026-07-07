import axios from "axios";

/**
 * External API Clients Configuration - FREE TIER APIS ONLY
 * All external APIs are configured here with proper error handling and retry logic
 */

const getEnv = (key: string): string => {
  return (import.meta as any).env?.[key] || "";
};

// ============ GROK API (xAI) - FREE TIER ============
// Sign up at: https://console.x.ai
export const grokClient = axios.create({
  baseURL: "https://api.x.ai/v1",
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getEnv("VITE_GROK_API_KEY")}`,
  },
});

// ============ YAHOO FINANCE (Stock Data) - FREE ============
// No API key required, but respectful rate limiting needed
export const yahooFinanceClient = axios.create({
  baseURL: "https://query1.finance.yahoo.com",
  timeout: 15_000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  },
});

// ============ FINNHUB API - FREE TIER ============
// Sign up at: https://finnhub.io
// Free tier: 60 API calls/minute
export const finnhubClient = axios.create({
  baseURL: "https://finnhub.io/api/v1",
  timeout: 15_000,
  params: {
    token: getEnv("VITE_FINNHUB_API_KEY"),
  },
});

// ============ COINGECKO API (Crypto Data) - FREE ============
// Completely free, no API key required
// Rate limit: 10-50 calls/minute depending on endpoint
export const coinGeckoClient = axios.create({
  baseURL: "https://api.coingecko.com/api/v3",
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============ NEWSAPI - FREE TIER ============
// Sign up at: https://newsapi.org
// Free tier: 100 requests/day
export const newsApiClient = axios.create({
  baseURL: "https://newsapi.org/v2",
  timeout: 15_000,
  headers: {
    "X-Api-Key": getEnv("VITE_NEWS_API_KEY"),
  },
});

// ============ TWELVEDATA API - FREE TIER ============
// Sign up at: https://twelvedata.com
// Free tier: 800 requests/day, 5 min delayed data
export const twelvedataClient = axios.create({
  baseURL: "https://api.twelvedata.com",
  timeout: 15_000,
  params: {
    apikey: getEnv("VITE_TWELVEDATA_API_KEY"),
  },
});

// ============ POLYGON.IO API - FREE TIER ============
// Sign up at: https://polygon.io
// Free tier: 5 API calls/minute
export const polygonClient = axios.create({
  baseURL: "https://api.polygon.io",
  timeout: 15_000,
  params: {
    apiKey: getEnv("VITE_POLYGON_API_KEY"),
  },
});

/**
 * Utility function for handling API errors
 */
export function handleApiError(error: unknown): { message: string; code?: string } {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return { message: "Unauthorized - Invalid API key", code: "AUTH_ERROR" };
    }
    if (error.response?.status === 429) {
      return { message: "Rate limit exceeded", code: "RATE_LIMIT" };
    }
    if (error.response?.status === 404) {
      return { message: "Resource not found", code: "NOT_FOUND" };
    }
    return {
      message: error.response?.data?.message || error.message || "API request failed",
      code: error.code,
    };
  }
  return { message: String(error) };
}

/**
 * Retry logic for failed API requests
 */
export async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      // Don't retry on 401 or 404
      if (axios.isAxiosError(error)) {
        if ([401, 404, 403].includes(error.response?.status || 0)) {
          throw error;
        }
      }
      if (i < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, delayMs * Math.pow(2, i)));
      }
    }
  }

  throw lastError;
}
