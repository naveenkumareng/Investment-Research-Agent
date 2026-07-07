# Investment Dashboard - Production Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Components                          │
│  (Dashboard, Portfolio, Watchlist, Stocks, News, AI, Alerts)    │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  │ useQuery/useMutation
                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                     React Query Cache                            │
│     (Handles stale/fresh, retries, mutations, invalidation)     │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  │ async function calls
                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                               │
│  stocks-service │ portfolio-service │ watchlist-service          │
│  news-service │ ai-service │ alerts-service                      │
└──┬──────────┬──────────┬──────────┬──────────┬──────────┬────────┘
   │          │          │          │          │          │
   ↓          ↓          ↓          ↓          ↓          ↓
┌──────────┐ ┌────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐ ┌─────────┐
│ Finnhub  │ │Grok AI │ │NewsAPI   │ │CoinGecko│ │localStorage│ │External│
│  Quotes  │ │ LLM    │ │ News     │ │ Crypto  │ │Persistence│ │  APIs  │
│ Charts   │ │        │ │          │ │  Data   │ │Portfolio   │ └─────────┘
│ Profiles │ │        │ │          │ │ Indices │ │Watchlist   │
│   News   │ │        │ │          │ │         │ │  Alerts    │
└──────────┘ └────────┘ └──────────┘ └────────┘ └──────────┘
```

## Data Flow

### 1. Stock Quote Fetch Flow

```
User Views Dashboard
  ↓
Dashboard Component useQuery(['stocks'])
  ↓
stocks-service.list()
  ↓
finnhubStocksService.getQuote(symbol) for each symbol
  ↓
finnhubClient.get('/quote', { symbol })
  ↓
[API Response] Quote data (price, change, etc)
  ↓
Transform to Stock type
  ↓
Parallel fetch company profile
  ↓
[API Response] Profile data (sector, industry, logo)
  ↓
Merge + return Stock object
  ↓
React Query caches result (5 min stale)
  ↓
Component renders with data
```

### 2. Portfolio Add Flow

```
User Submits Form
  ↓
portfolioService.add({ symbol, quantity, avgPrice, ... })
  ↓
Fetch current price via finnhubStocksService.getQuote(symbol)
  ↓
[API Response] Current price
  ↓
Calculate: invested, currentValue, pnl, pnlPercent
  ↓
Create Holding object with generated ID
  ↓
Save to localStorage[HOLDINGS]
  ↓
Log activity to localStorage[ACTIVITY]
  ↓
Return created Holding
  ↓
React Query invalidates ['portfolio']
  ↓
Component refetches and updates
```

### 3. News Search Flow

```
User Searches "Tesla"
  ↓
newsService.list(category, query)
  ↓
newsApiService.search("Tesla electronics")
  ↓
newsApiClient.get('/everything', {
    q: "Tesla electronics",
    sortBy: "publishedAt",
    language: "en",
    pageSize: 20
})
  ↓
[API Response] Array of articles
  ↓
Filter articles with title + description
  ↓
For each article:
  - Categorize (based on title keywords)
  - Detect sentiment (positive/negative/neutral)
  - Extract stock symbols
  - Format to NewsArticle type
  ↓
Return formatted articles
  ↓
React Query caches
  ↓
Component renders with news grid
```

### 4. AI Analysis Flow

```
User Enters Query "How is Apple?"
  ↓
aiService.analyze("How is Apple?")
  ↓
grokAiService.analyze(query)
  ↓
Extract symbol from query → "AAPL"
  ↓
Fetch real data: finnhubStocksService.getQuote("AAPL")
  ↓
[API Response] Real stock data
  ↓
Build analysis prompt with real data injected
  ↓
grokClient.post('/chat/completions', {
    model: "grok-beta",
    messages: [
        { role: "system", content: financial_analyst_prompt },
        { role: "user", content: analysis_prompt_with_data }
    ]
})
  ↓
[API Response] Grok analysis text
  ↓
Parse response:
  - Extract recommendation
  - Extract risk score
  - Extract target price
  - Split into key sections
  - Extract pros/cons
  ↓
Return AIInsight object
  ↓
React Query caches
  ↓
Component renders analysis
```

## Service Architecture

### finnhub-stocks-service.ts

**Purpose**: Real-time and historical stock data

```typescript
Interface:
  getQuote(symbol) → Stock
  search(query) → Stock[]
  getChartData(symbol, range) → PricePoint[]
  getNews(symbol) → News[]
  getBasicFinancials(symbol) → Financials

Rate Limits: 60 calls/minute
Caching: 5 minutes recommended
```

### grok-ai-service.ts

**Purpose**: LLM-powered financial analysis

```typescript
Interface:
  analyze(query) → AIInsight
  getRecommendations(symbols) → string
  chat(messages) → string

Model: grok-beta
Rate Limits: Variable (check x.ai docs)
Inputs: Real market data + user query
Outputs: Structured investment insights
```

### newsapi-service.ts

**Purpose**: Financial news aggregation

```typescript
Interface:
  search(query, category) → NewsArticle[]
  getHeadlines(category) → NewsArticle[]
  getStockNews(symbol) → NewsArticle[]
  getTrending() → NewsArticle[]

Rate Limits: 100 requests/day
Categories: business, tech, crypto, market, earnings, ipo, economy
Sentiment: Detected automatically
```

### portfolio-service-persistent.ts

**Purpose**: Portfolio management with localStorage

```typescript
Interface:
  holdings() → Holding[] (with live prices)
  add(input) → Holding
  update(id, changes) → Holding
  remove(id) → { ok: true }
  activity() → Activity[]
  getSummary() → PortfolioSummary

Storage: localStorage (HOLDINGS, ACTIVITY)
Pricing: Updated from Finnhub on load
Activity: Logged with timestamps
```

### watchlist-service-persistent.ts

**Purpose**: Saved symbols tracking

```typescript
Interface:
  list() → WatchlistItem[] (with live prices)
  add(symbol) → WatchlistItem
  remove(symbol) → { ok: true }
  isInWatchlist(symbol) → boolean
  getTopGainers/getTopLosers() → WatchlistItem[]

Storage: localStorage (WATCHLIST)
Pricing: Updated from Finnhub
```

### alerts-service-persistent.ts

**Purpose**: Price and technical alerts

```typescript
Interface:
  list() → Alert[]
  add(alert) → Alert
  update(id, changes) → Alert
  remove(id) → { ok: true }
  toggle(id) → Alert
  checkAlerts() → Alert[] (triggered)

Storage: localStorage (ALERTS)
Types: price, volume, ma, rsi, ema
Conditions: above, below, crosses
Monitoring: Client-side on demand
```

## Type Definitions

### Stock

```typescript
{
  symbol: string,
  name: string,
  exchange: string,
  sector: string,
  industry: string,
  price: number,
  change: number,
  changePercent: number,
  open: number,
  previousClose: number,
  dayHigh: number,
  dayLow: number,
  weekHigh52: number,
  weekLow52: number,
  volume: number,
  avgVolume: number,
  marketCap: number,
  peRatio: number,
  eps: number,
  dividend: number,
  dividendYield: number,
  beta: number,
  currency: string,
  logo?: string,
  website?: string,
  description?: string
}
```

### Holding

```typescript
{
  id: string,
  symbol: string,
  name: string,
  quantity: number,
  avgPrice: number,
  purchaseDate: string,
  broker: string,
  currentPrice: number,
  invested: number,
  currentValue: number,
  pnl: number,
  pnlPercent: number
}
```

### NewsArticle

```typescript
{
  id: string,
  title: string,
  summary: string,
  content: string,
  source: string,
  sourceUrl: string,
  category: string,
  imageUrl?: string,
  url: string,
  publishedAt: string,
  author?: string,
  sentiment?: 'positive' | 'negative' | 'neutral',
  symbols?: string[]
}
```

### AIInsight

```typescript
{
  symbol: string,
  companyName: string,
  summary: string,
  businessOverview: string,
  growthPotential: string,
  financialHealth: string,
  fundamentalAnalysis: string,
  technicalAnalysis: string,
  pros: string[],
  cons: string[],
  riskScore: number,
  confidenceScore: number,
  recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell',
  targetPrice: number,
  futureOutlook: string
}
```

## Error Handling Strategy

### Error Types

1. **Network Errors**
   - Timeout
   - Connection refused
   - DNS failure
   - **Handling**: Show error message, offer retry

2. **API Errors**
   - 401 Unauthorized (bad API key)
   - 429 Rate limited
   - 404 Not found
   - 500 Server error
   - **Handling**: Show specific message, disable retries for 401/404

3. **Data Errors**
   - Invalid response format
   - Missing required fields
   - Type mismatch
   - **Handling**: Log and return null, use fallback

4. **Storage Errors**
   - localStorage full
   - localStorage disabled
   - Quota exceeded
   - **Handling**: Show warning, continue without persistence

### Retry Logic

```typescript
retryRequest(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
)
```

- Exponential backoff: delay × 2^attemptIndex
- No retry for 401, 403, 404
- Max delay: 30 seconds

### User-Facing Messages

```typescript
// Connection error
"Unable to connect to server. Please check your internet connection.";

// API error
"API service temporarily unavailable. Please try again in a moment.";

// Rate limit
"Too many requests. Waiting before retrying...";

// Not found
"Stock symbol not found. Please verify the symbol.";

// Validation error
"Invalid input. Please check your data and try again.";
```

## Caching Strategy

### React Query Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min until stale
      gcTime: 10 * 60 * 1000, // 10 min until garbage collected
      retry: 2,
      retryDelay: exponentialBackoff,
    },
  },
});
```

### Cache Keys

```typescript
['stocks'] → All stocks list (5 min)
['stock', symbol] → Single quote (5 min)
['stock-chart', symbol, range] → Chart data (10 min)
['portfolio'] → Holdings with current prices (5 min)
['watchlist'] → Watched symbols (5 min)
['news', category, query] → News results (15 min)
['ai-insight', query] → AI analysis (30 min)
['alerts'] → User alerts (1 min)
```

### Invalidation Triggers

```
Add holding → invalidate ['portfolio']
Remove holding → invalidate ['portfolio']
Update holding → invalidate ['portfolio']
Add watchlist → invalidate ['watchlist']
Remove watchlist → invalidate ['watchlist']
Update alert → invalidate ['alerts']
```

## Performance Considerations

### Parallel Requests

```typescript
// Good: Parallel
const [quotes, profiles] = await Promise.all([
  finnhubClient.get("/quote"),
  finnhubClient.get("/stock/profile2"),
]);

// Bad: Sequential (slower)
const quote = await finnhubClient.get("/quote");
const profile = await finnhubClient.get("/stock/profile2");
```

### Lazy Loading

```typescript
// Load chart only when tab clicked
<Tabs>
  <Tab value="chart">
    <ChartTab symbol={symbol} /> {/* Loads on click */}
  </Tab>
</Tabs>
```

### Pagination

```typescript
// Fetch 20 items per page
getNews(category, limit: 20)
// User scrolls → fetch next page
getNews(category, page: 2, limit: 20)
```

## Security Considerations

1. **API Keys**
   - All in environment variables
   - Never commit to git
   - Rotate regularly

2. **Input Validation**
   - Validate all user inputs
   - Symbol format checking
   - Numeric range validation

3. **CORS**
   - All external APIs handle CORS
   - No proxy needed
   - Client-side requests safe

4. **localStorage Security**
   - No sensitive data stored
   - Plain encryption for portfolio data
   - Clear on logout

## Monitoring & Debugging

### Logs to Capture

```typescript
// API calls
console.log(`Fetching ${symbol} from Finnhub`);

// Errors with context
console.error(`Failed to fetch ${symbol}:`, error);

// Performance
console.time("Stock Quote");
// ... code ...
console.timeEnd("Stock Quote");
```

### DevTools Features

- Network tab for API calls
- Application tab for localStorage
- Console for errors and logs
- Performance for timings

## Future Enhancements

1. **Backend Integration**
   - User authentication
   - Database persistence
   - Multi-device sync

2. **Real-Time Updates**
   - WebSocket connections
   - Live price streaming
   - Real-time alerts

3. **Advanced Features**
   - Technical indicators
   - Advanced charting
   - Portfolio optimization
   - Backtesting

4. **Mobile App**
   - React Native version
   - Push notifications
   - Offline mode

5. **API Gateway**
   - Rate limit management
   - Request aggregation
   - Intelligent caching
