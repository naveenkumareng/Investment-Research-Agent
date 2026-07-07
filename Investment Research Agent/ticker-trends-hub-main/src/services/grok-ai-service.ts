import { grokClient, handleApiError, retryRequest } from "@/lib/external-apis";
import type { AIInsight, Stock } from "@/types";
import { finnhubStocksService } from "./finnhub-stocks-service";

interface GrokMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GrokResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Grok AI Service - LLM-powered financial analysis
 *
 * Replaces hardcoded analysis with real AI insights using xAI's Grok
 * Provides:
 * - Stock fundamental analysis
 * - Technical recommendations
 * - Risk assessment
 * - Investment insights
 */
export const grokAiService = {
  /**
   * Analyze stock with real market data and AI
   */
  async analyze(query: string): Promise<AIInsight> {
    try {
      // Extract symbol from query
      const symbol = extractSymbol(query);
      if (!symbol) {
        return createErrorInsight(query, "Could not identify stock symbol in query");
      }

      // Fetch real stock data
      const stock = await finnhubStocksService.getQuote(symbol);
      if (!stock) {
        return createErrorInsight(query, `Stock ${symbol} not found`);
      }

      // Build analysis prompt with real data
      const analysisPrompt = buildAnalysisPrompt(stock, query);

      // Get analysis from Grok
      const response = await retryRequest(
        () =>
          grokClient.post<GrokResponse>("/chat/completions", {
            model: "grok-beta",
            messages: [
              {
                role: "system",
                content: `You are an expert financial analyst specializing in stock market analysis. 
Analyze the provided stock data and deliver a structured analysis with:
1. Business Overview (2-3 sentences)
2. Growth Potential (1-2 sentences)
3. Financial Health (1-2 sentences)
4. Fundamental Analysis (2-3 key metrics)
5. Technical Outlook (1-2 sentences)
6. 3 Key Pros
7. 3 Key Cons
8. Investment Recommendation (Strong Buy/Buy/Hold/Sell/Strong Sell)
9. Target Price (12-month)
10. Risk Score (0-100)

Be specific, use numbers from the provided data, and be realistic.`,
              },
              {
                role: "user",
                content: analysisPrompt,
              },
            ] as GrokMessage[],
            temperature: 0.7,
            max_tokens: 1500,
          }),
        2,
        1000,
      );

      const content = response.data.choices[0]?.message?.content || "";

      // Parse the response into structured AIInsight
      return parseGrokAnalysis(content, stock);
    } catch (error) {
      const apiError = handleApiError(error);
      console.error("Grok AI Service Error:", apiError);

      return createErrorInsight(query, `Analysis unavailable: ${apiError.message}`);
    }
  },

  /**
   * Get recommendations for multiple stocks
   */
  async getRecommendations(symbols: string[]): Promise<string> {
    try {
      if (symbols.length === 0) {
        return "No symbols provided";
      }

      // Fetch data for all symbols
      const stocks = await Promise.all(symbols.map((s) => finnhubStocksService.getQuote(s)));

      const validStocks = stocks.filter((s): s is Stock => s !== null);

      if (validStocks.length === 0) {
        return "Could not fetch data for any of the symbols";
      }

      const stocksInfo = validStocks
        .map(
          (s) =>
            `${s.symbol}: $${s.price.toFixed(2)} (${s.changePercent.toFixed(2)}% today), ${s.name}`,
        )
        .join("\n");

      const response = await retryRequest(
        () =>
          grokClient.post<GrokResponse>("/chat/completions", {
            model: "grok-beta",
            messages: [
              {
                role: "system",
                content:
                  "You are a financial advisor. Provide actionable stock recommendations based on current market conditions.",
              },
              {
                role: "user",
                content: `Based on current market data, provide recommendations for these stocks:\n${stocksInfo}\n\nBe concise, specific, and actionable.`,
              },
            ] as GrokMessage[],
            temperature: 0.5,
            max_tokens: 500,
          }),
        2,
        1000,
      );

      return response.data.choices[0]?.message?.content || "No recommendations available";
    } catch (error) {
      const apiError = handleApiError(error);
      console.error("Failed to get recommendations:", apiError);
      throw new Error(`Recommendation service error: ${apiError.message}`);
    }
  },

  /**
   * Interactive chat for investment questions
   */
  async chat(messages: Array<{ role: "user" | "assistant"; content: string }>): Promise<string> {
    try {
      if (messages.length === 0) {
        return "No messages provided";
      }

      const formattedMessages: GrokMessage[] = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await retryRequest(
        () =>
          grokClient.post<GrokResponse>("/chat/completions", {
            model: "grok-beta",
            messages: [
              {
                role: "system",
                content: `You are a knowledgeable financial assistant specializing in stock market analysis. 
Provide accurate, concise, and practical information about stocks, markets, and investments. 
Base recommendations on real market data when possible. Always disclose when making assumptions.`,
              },
              ...formattedMessages,
            ],
            temperature: 0.7,
            max_tokens: 800,
          }),
        2,
        1000,
      );

      return response.data.choices[0]?.message?.content || "No response available";
    } catch (error) {
      const apiError = handleApiError(error);
      console.error("Chat error:", apiError);
      throw new Error(`Chat service error: ${apiError.message}`);
    }
  },
};

/**
 * Build detailed analysis prompt with real stock data
 */
function buildAnalysisPrompt(stock: Stock, userQuery: string): string {
  return `Analyze this stock data:

Stock: ${stock.symbol} - ${stock.name}
Exchange: ${stock.exchange}
Sector: ${stock.sector || "Unknown"}

CURRENT PRICE DATA:
- Current Price: $${stock.price.toFixed(2)}
- Change: ${stock.change.toFixed(2)} (${stock.changePercent.toFixed(2)}%)
- 52-Week High: $${stock.weekHigh52.toFixed(2)}
- 52-Week Low: $${stock.weekLow52.toFixed(2)}
- Market Cap: ${formatMarketCap(stock.marketCap)}
- P/E Ratio: ${stock.peRatio > 0 ? stock.peRatio.toFixed(2) : "N/A"}
- EPS: ${stock.eps > 0 ? stock.eps.toFixed(2) : "N/A"}
- Dividend Yield: ${stock.dividendYield > 0 ? stock.dividendYield.toFixed(2) + "%" : "No dividend"}

DESCRIPTION: ${stock.description || "No description available"}

USER QUERY: ${userQuery}

Provide a comprehensive investment analysis focusing on the specific query.`;
}

/**
 * Parse Grok's response into structured AIInsight
 */
function parseGrokAnalysis(content: string, stock: Stock): AIInsight {
  const lines = content.split("\n").filter((line) => line.trim().length > 0);

  // Extract key information using regex patterns
  const recommendation = extractRecommendation(content);
  const riskScore = extractNumber(content, /risk score[:\s]+(\d+)/i, 50);
  const targetPrice = extractNumber(
    content,
    /target\s+price[:\s]+\$?([\d.]+)/i,
    stock.price * 1.15,
  );
  const pros = extractList(
    content,
    /(?:pros?|strengths?|advantages?)[:\s]*([^]*?)(?=cons?|weaknesses?|disadvantages?)/i,
    ["Strong fundamentals", "Growing market", "Positive momentum"],
  );
  const cons = extractList(
    content,
    /(?:cons?|weaknesses?|disadvantages?)[:\s]*(.+?)(?=$|analyst|risk)/i,
    ["Market volatility", "Competitive pressures", "Valuation concerns"],
  );

  return {
    symbol: stock.symbol,
    companyName: stock.name,
    summary: lines.slice(0, 3).join(" ").substring(0, 300),
    businessOverview: extractSection(
      content,
      "Business Overview|Overview",
      "Grok-analyzed business segments",
    ),
    growthPotential: extractSection(
      content,
      "Growth Potential|Growth",
      "Positive trajectory expected",
    ),
    financialHealth: extractSection(content, "Financial Health|Health", "Financially stable"),
    fundamentalAnalysis: extractSection(content, "Fundamental|Fundamentals", "Strong fundamentals"),
    technicalAnalysis: extractSection(
      content,
      "Technical|Technical Analysis",
      "Price momentum positive",
    ),
    pros,
    cons,
    riskScore,
    confidenceScore: Math.max(55, 100 - Math.abs(riskScore - 50)),
    recommendation,
    targetPrice,
    futureOutlook: extractSection(content, "Outlook|Future|Prospects", "Positive outlook"),
  };
}

/**
 * Extract recommendation from text
 */
function extractRecommendation(
  text: string,
): "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell" {
  const lower = text.toLowerCase();

  if (lower.includes("strong buy")) return "Strong Buy";
  if (lower.includes("strong sell")) return "Strong Sell";
  if (lower.includes("buy")) return "Buy";
  if (lower.includes("sell")) return "Sell";
  if (lower.includes("hold") || lower.includes("neutral")) return "Hold";

  return "Hold";
}

/**
 * Extract first number matching pattern
 */
function extractNumber(text: string, pattern: RegExp, defaultValue: number): number {
  const match = text.match(pattern);
  if (match && match[1]) {
    const num = parseFloat(match[1]);
    return isNaN(num) ? defaultValue : num;
  }
  return defaultValue;
}

/**
 * Extract section text
 */
function extractSection(text: string, headers: string, fallback: string): string {
  const pattern = new RegExp(
    `(?:${headers})[:\s]*([^]*?)(?=\\n\\n|(?:pros?|cons?|risk|recommendation))`,
  );
  const match = text.match(pattern);
  if (match && match[1]) {
    return match[1].trim().substring(0, 500);
  }
  return fallback;
}

/**
 * Extract list items from text
 */
function extractList(text: string, pattern: RegExp, fallback: string[]): string[] {
  const match = text.match(pattern);
  if (!match || !match[1]) {
    return fallback;
  }

  const items = match[1]
    .split(/[\n-•]/i)
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item.length < 200)
    .slice(0, 3);

  return items.length > 0 ? items : fallback;
}

/**
 * Format market cap for display
 */
function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
  if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
  if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
  return `$${marketCap.toFixed(0)}`;
}

/**
 * Extract stock symbol from query text
 */
function extractSymbol(query: string): string | null {
  // Try to find a stock symbol (1-5 uppercase letters)
  const match = query.match(/\b([A-Z]{1,5})\b/);
  return match ? match[1] : null;
}

/**
 * Create error insight
 */
function createErrorInsight(query: string, errorMessage: string): AIInsight {
  return {
    symbol: "UNKNOWN",
    companyName: "Unknown",
    summary: errorMessage,
    businessOverview: errorMessage,
    growthPotential: "Unable to assess",
    financialHealth: "Unable to assess",
    fundamentalAnalysis: "Unable to assess",
    technicalAnalysis: "Unable to assess",
    pros: ["Please check your query", "Ensure symbol is correct"],
    cons: ["Data unavailable"],
    riskScore: 50,
    confidenceScore: 0,
    recommendation: "Hold",
    targetPrice: 0,
    futureOutlook: "Unable to forecast",
  };
}
