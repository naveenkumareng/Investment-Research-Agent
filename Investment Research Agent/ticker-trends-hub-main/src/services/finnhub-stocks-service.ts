import { finnhubClient, handleApiError, retryRequest } from "@/lib/external-apis";
import type { Stock, TimeRange, PricePoint } from "@/types";

interface FinnhubQuote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High
  l: number; // Low
  o: number; // Open
  pc: number; // Previous close
  t: number; // Timestamp
}

interface FinnhubProfile {
  country: string;
  currency: string;
  description: string;
  exchange: string;
  finnhubIndustry: string;
  ipo: string;
  logo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
}

interface FinnhubCandle {
  c: number[]; // Close prices
  h: number[]; // High prices
  l: number[]; // Low prices
  o: number[]; // Open prices
  s: string; // Status
  t: number[]; // Timestamps
  v: number[]; // Volumes
}

interface FinnhubSearchResult {
  result: Array<{
    symbol: string;
    description: string;
    displaySymbol: string;
    type: string;
  }>;
}

/**
 * Finnhub Stocks Service - Production stock data API
 * Free tier: 60 API calls/minute
 *
 * Provides:
 * - Real-time stock quotes
 * - Company profiles
 * - Historical OHLCV data
 * - Symbol search
 * - Top movers
 */
export const finnhubStocksService = {
  /**
   * Get real-time stock quote with company info
   */
  async getQuote(symbol: string): Promise<Stock | null> {
    try {
      const upperSymbol = symbol.toUpperCase();

      const [quoteRes, profileRes] = await Promise.all([
        retryRequest(
          () =>
            finnhubClient.get<FinnhubQuote>("/quote", {
              params: { symbol: upperSymbol },
            }),
          2,
          500,
        ),
        retryRequest(
          () =>
            finnhubClient.get<FinnhubProfile>("/stock/profile2", {
              params: { symbol: upperSymbol },
            }),
          2,
          500,
        ),
      ]);

      const quote = quoteRes.data;
      const profile = profileRes.data;

      // Validate we have price data
      if (!quote.c || quote.c === 0) {
        console.warn(`No price data for ${symbol}`);
        return null;
      }

      return {
        symbol: upperSymbol,
        name: profile.name || symbol,
        exchange: profile.exchange || "UNKNOWN",
        sector: profile.finnhubIndustry || "Unknown",
        industry: profile.finnhubIndustry || "Unknown",
        price: quote.c,
        change: quote.d,
        changePercent: quote.dp,
        open: quote.o,
        previousClose: quote.pc,
        dayHigh: quote.h,
        dayLow: quote.l,
        volume: 0,
        avgVolume: 0,
        marketCap: profile.marketCapitalization || 0,
        peRatio: 0,
        eps: 0,
        dividend: 0,
        dividendYield: 0,
        beta: 0,
        currency: profile.currency || "USD",
        weekHigh52: 0,
        weekLow52: 0,
        logo: profile.logo,
        website: profile.weburl,
        description: profile.description,
        ceo: "",
        employees: 0,
      };
    } catch (error) {
      const apiError = handleApiError(error);
      console.error(`Error fetching quote for ${symbol}:`, apiError);
      return null;
    }
  },

  /**
   * Search for stocks by symbol or name
   */
  async search(query: string, limit: number = 10): Promise<Stock[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      const response = await retryRequest(
        () =>
          finnhubClient.get<FinnhubSearchResult>("/search", {
            params: { q: query.trim(), limit },
          }),
        2,
        500,
      );

      const results = response.data.result || [];

      // Filter for common stock types and fetch quotes
      const symbols = results
        .filter((r) => r.type === "Common Stock" || r.type === "ETF")
        .slice(0, 5)
        .map((r) => r.symbol);

      const stocks = await Promise.all(symbols.map((symbol) => this.getQuote(symbol)));

      return stocks.filter((s): s is Stock => s !== null);
    } catch (error) {
      const apiError = handleApiError(error);
      console.error("Error searching stocks:", apiError);
      return [];
    }
  },

  /**
   * Get historical price data for charting
   */
  async getChartData(symbol: string, range: TimeRange = "1M"): Promise<PricePoint[]> {
    try {
      const { resolution, from, to } = getTimeRangeParams(range);

      const response = await retryRequest(
        () =>
          finnhubClient.get<FinnhubCandle>("/stock/candle", {
            params: {
              symbol: symbol.toUpperCase(),
              resolution,
              from,
              to,
            },
          }),
        2,
        500,
      );

      // Check if we got valid data
      if (response.data.s !== "ok" || !response.data.t || response.data.t.length === 0) {
        console.warn(`No chart data for ${symbol} in range ${range}`);
        return [];
      }

      return response.data.t.map((timestamp, index) => ({
        time: new Date(timestamp * 1000).toISOString(),
        price: response.data.c[index] || 0,
        volume: response.data.v[index] || 0,
      }));
    } catch (error) {
      const apiError = handleApiError(error);
      console.error(`Error fetching chart for ${symbol}:`, apiError);
      return [];
    }
  },

  /**
   * Get company news (max 5 articles from last 30 days)
   */
  async getNews(
    symbol: string,
  ): Promise<Array<{ title: string; url: string; datetime: string; image?: string }>> {
    try {
      const response = await retryRequest(
        () =>
          finnhubClient.get<
            Array<{
              headline: string;
              url: string;
              datetime: number;
              image?: string;
            }>
          >("/company-news", {
            params: {
              symbol: symbol.toUpperCase(),
              from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              to: new Date().toISOString().split("T")[0],
            },
          }),
        2,
        500,
      );

      return (response.data || []).slice(0, 5).map((article) => ({
        title: article.headline,
        url: article.url,
        datetime: new Date(article.datetime * 1000).toISOString(),
        image: article.image,
      }));
    } catch (error) {
      const apiError = handleApiError(error);
      console.error(`Error fetching news for ${symbol}:`, apiError);
      return [];
    }
  },

  /**
   * Get company basic financials
   */
  async getBasicFinancials(symbol: string): Promise<{
    peRatio?: number;
    eps?: number;
    dividend?: number;
    dividendYield?: number;
    beta?: number;
    week52High?: number;
    week52Low?: number;
  } | null> {
    try {
      const response = await retryRequest(
        () =>
          finnhubClient.get<any>("/stock/metric", {
            params: {
              symbol: symbol.toUpperCase(),
              metric: "all",
            },
          }),
        2,
        500,
      );

      const data = response.data;
      return {
        peRatio: data.peNormalizedAnnual,
        eps: data.epsTrailingTwelveMonths,
        dividend: data.dividendPerShareAnnual,
        dividendYield: data.dividendYieldIndicatedAnnual,
        beta: data.beta,
        week52High: data.high52Week,
        week52Low: data.low52Week,
      };
    } catch (error) {
      const apiError = handleApiError(error);
      console.warn(`Could not fetch financials for ${symbol}:`, apiError);
      return null;
    }
  },
};

/**
 * Helper: Convert time range to Finnhub resolution and timestamps
 */
function getTimeRangeParams(range: TimeRange): {
  resolution: "1" | "5" | "15" | "30" | "60" | "D" | "W" | "M";
  from: number;
  to: number;
} {
  const now = Math.floor(Date.now() / 1000);
  let days = 30;
  let resolution: "1" | "5" | "15" | "30" | "60" | "D" | "W" | "M" = "D";

  switch (range) {
    case "1D":
      days = 1;
      resolution = "5"; // 5-minute bars
      break;
    case "1W":
      days = 7;
      resolution = "60"; // 1-hour bars
      break;
    case "1M":
      days = 30;
      resolution = "D"; // Daily
      break;
    case "3M":
      days = 90;
      resolution = "W"; // Weekly
      break;
    case "6M":
      days = 180;
      resolution = "W";
      break;
    case "1Y":
      days = 365;
      resolution = "M"; // Monthly
      break;
    case "5Y":
      days = 1825;
      resolution = "M";
      break;
    case "MAX":
      days = 10950; // ~30 years
      resolution = "M";
      break;
  }

  const from = now - days * 24 * 60 * 60;
  return { resolution, from, to: now };
}
