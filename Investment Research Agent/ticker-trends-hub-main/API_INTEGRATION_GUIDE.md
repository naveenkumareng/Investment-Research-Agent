# API Integration Guide

This guide explains how to use the integrated APIs in the Ticker Trends Hub project.

## 🔑 API Keys Configuration

All API keys are stored in `.env` file (already created for you). The `.env.example` file shows all required keys.

### Current Integrated APIs

| API               | Tier | Endpoint                  | Features                     |
| ----------------- | ---- | ------------------------- | ---------------------------- |
| **Grok AI (xAI)** | Free | https://api.x.ai/v1       | AI-powered stock analysis    |
| **Finnhub**       | Free | https://finnhub.io        | Real-time stock quotes, news |
| **NewsAPI**       | Free | https://newsapi.org       | Financial news aggregation   |
| **CoinGecko**     | Free | https://coingecko.com     | Cryptocurrency data          |
| **Yahoo Finance** | Free | https://finance.yahoo.com | Stock historical data        |
| **Polygon.IO**    | Free | https://polygon.io        | Market data                  |
| **Twelvedata**    | Free | https://twelvedata.com    | Stock & forex data           |

## 📚 Usage Examples

### 1. Grok AI Service

**File**: `src/services/grok-ai-service.ts`

```typescript
import { grokAiService } from "@/services/grok-ai-service";

// Get AI analysis for a stock
const analysis = await grokAiService.analyze("Should I buy AAPL stock?");
console.log(analysis.sentiment, analysis.score);

// Get recommendations
const recommendations = await grokAiService.getRecommendations(["AAPL", "MSFT", "GOOGL"]);

// Chat with AI
const response = await grokAiService.chat([
  { role: "user", content: "What's the difference between stocks and bonds?" },
]);
```

**Response Type**:

```typescript
{
  symbol: string;
  title: string;
  content: string;
  sentiment: "positive" | "negative" | "neutral";
  score: number;
  keyPoints: string[];
}
```

---

### 2. Finnhub Stocks Service

**File**: `src/services/finnhub-stocks-service.ts`

```typescript
import { finnhubStocksService } from "@/services/finnhub-stocks-service";

// Get real-time stock quote
const stock = await finnhubStocksService.getQuote("AAPL");

// Search for stocks
const results = await finnhubStocksService.search("Apple");

// Get historical data
const chartData = await finnhubStocksService.getChartData("AAPL", "1M");

// Get company news
const news = await finnhubStocksService.getNews("AAPL");
```

**Response Types**:

```typescript
// Stock quote
{
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  // ... more fields
}

// Chart data
[
  {
    time: "2024-01-15T10:00:00Z";
    price: 150.25;
    volume: 1000000;
  }
]

// Company news
[
  {
    title: string;
    url: string;
    datetime: string;
  }
]
```

---

### 3. NewsAPI Service

**File**: `src/services/newsapi-service.ts`

```typescript
import { newsApiService } from "@/services/newsapi-service";

// Search for news
const articles = await newsApiService.search("stock market", "business");

// Get headlines
const headlines = await newsApiService.getHeadlines("business");

// Get stock-specific news
const stockNews = await newsApiService.getStockNews("AAPL");

// Get trending topics
const trending = await newsApiService.getTrending();
```

**Response Type**:

```typescript
{
  id: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  sourceUrl: string;
  category: "business" | "technology" | "crypto" | "market" | "earnings" | "ipo";
  image: string;
  date: string;
  author: string;
}
```

---

## ⚙️ How to Add a New API

### Step 1: Create the API Client

Add your API client to `src/lib/external-apis.ts`:

```typescript
export const myApiClient = axios.create({
  baseURL: "https://api.example.com",
  timeout: 15_000,
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_MY_API_KEY || ""}`,
  },
});
```

### Step 2: Create a Service

Create `src/services/my-api-service.ts`:

```typescript
import { myApiClient, handleApiError, retryRequest } from "@/lib/external-apis";

export const myApiService = {
  async getData() {
    try {
      const response = await retryRequest(() => myApiClient.get("/endpoint"), 3, 1000);
      return response.data;
    } catch (error) {
      const apiError = handleApiError(error);
      throw new Error(apiError.message);
    }
  },
};
```

### Step 3: Add Environment Variable

Update `.env` and `.env.example`:

```env
VITE_MY_API_KEY=your_api_key_here
```

---

## 🔄 Error Handling

All services use the `handleApiError` utility:

```typescript
import { handleApiError } from "@/lib/external-apis";

try {
  // API call
} catch (error) {
  const { message, code } = handleApiError(error);
  console.error(`Error (${code}): ${message}`);

  // Handle specific errors
  if (code === "RATE_LIMIT") {
    // Wait and retry
  } else if (code === "AUTH_ERROR") {
    // Check API key
  }
}
```

---

## 🔁 Retry Logic

All services include automatic retry logic with exponential backoff:

```typescript
import { retryRequest } from "@/lib/external-apis";

const result = await retryRequest(
  () => apiClient.get("/endpoint"),
  3, // max retries
  1000, // initial delay in ms
);
```

**Retry behavior**:

- Retries on network errors and 5xx status codes
- Does NOT retry on 401, 403, 404 (permanent errors)
- Exponential backoff: 1s → 2s → 4s

---

## 📊 API Rate Limits

| Service       | Free Tier Limit  | Notes                     |
| ------------- | ---------------- | ------------------------- |
| Grok (xAI)    | Depends on plan  | Check console.x.ai        |
| Finnhub       | 60 calls/min     | Respectfully rate-limited |
| NewsAPI       | 100 requests/day | Free tier limitation      |
| CoinGecko     | 10-50 calls/min  | Endpoint-dependent        |
| Polygon.IO    | 5 calls/min      | Free tier                 |
| Twelvedata    | 800 requests/day | 5-minute delayed data     |
| Yahoo Finance | Unlimited        | No API key needed         |

**Best practices**:

- Cache results when possible
- Use appropriate time ranges to reduce calls
- Implement client-side caching (60-300 seconds)
- Monitor API usage in .env logs

---

## 🚀 Integrating Services into Components

### Example: Stock Card Component

```typescript
import { useEffect, useState } from "react";
import { finnhubStocksService } from "@/services/finnhub-stocks-service";
import { grokAiService } from "@/services/grok-ai-service";

export function StockCard({ symbol }: { symbol: string }) {
  const [stock, setStock] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [stockData, aiAnalysis] = await Promise.all([
          finnhubStocksService.getQuote(symbol),
          grokAiService.analyze(symbol)
        ]);

        setStock(stockData);
        setAnalysis(aiAnalysis);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [symbol]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>{stock?.name}</h2>
      <p>Price: ${stock?.price}</p>
      <p>Sentiment: {analysis?.sentiment}</p>
      <p>{analysis?.content}</p>
    </div>
  );
}
```

---

## 🔐 Security Best Practices

1. **Never commit `.env` file** - Only `.env.example` should be in git
2. **Use environment variables** - Import from `import.meta.env.VITE_*`
3. **Validate API responses** - Check status codes and data structure
4. **Rate limit requests** - Implement throttling for user actions
5. **Handle errors gracefully** - Show user-friendly messages
6. **Log API errors** - Use console for debugging

---

## 📝 Migration from Mock Services

Replace mock services with real API services:

**Before** (mock):

```typescript
import { aiService } from "@/services/ai-service";
const analysis = await aiService.analyze(query);
```

**After** (real):

```typescript
import { grokAiService } from "@/services/grok-ai-service";
const analysis = await grokAiService.analyze(query);
```

---

## 🐛 Troubleshooting

### Issue: "API key not found"

- Check `.env` file exists in project root
- Verify key name matches `VITE_*` pattern
- Restart dev server after adding keys

### Issue: "Rate limit exceeded"

- Implement caching on frontend
- Use longer time intervals between requests
- Consider upgrading API plan

### Issue: "CORS errors"

- Some APIs might require proxy setup
- Use backend API as proxy if needed
- Contact API provider for CORS configuration

### Issue: "401 Unauthorized"

- Verify API key is correct and active
- Check API key hasn't been revoked
- Ensure key has correct permissions

---

## 📚 API Documentation Links

- [Grok API Docs](https://docs.x.ai/api/console)
- [Finnhub Docs](https://finnhub.io/docs/api)
- [NewsAPI Docs](https://newsapi.org/docs)
- [CoinGecko API](https://www.coingecko.com/en/api/documentation)
- [Polygon.IO Docs](https://polygon.io/docs)
- [Twelvedata Docs](https://twelvedata.com/docs)

---

## 📞 Support

For issues with:

- **API Integration**: Check the specific service file
- **Environment Setup**: Review `.env.example`
- **Error Handling**: Look at `handleApiError` in `external-apis.ts`
- **Rate Limiting**: Check individual API documentation
