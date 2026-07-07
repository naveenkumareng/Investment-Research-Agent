# Investment Dashboard - Production Conversion Plan

## Overview

Convert the demo dashboard from 100% mock data to production-ready with real API integration.

## Architecture

### Data Sources

- **Stocks**: Finnhub API (primary), Twelvedata (backup)
- **Crypto**: CoinGecko API (free, no key)
- **News**: NewsAPI.org
- **AI Analysis**: Grok (xAI) LLM
- **Portfolio/Watchlist**: Local persistence + optional backend

### API Clients

- `grokClient` - Grok AI (LLM)
- `finnhubClient` - Finnhub quotes & search
- `twelvedataClient` - Twelvedata time series
- `newsApiClient` - NewsAPI news
- `coinGeckoClient` - CoinGecko crypto (no auth)
- `polygonClient` - Polygon.IO (fallback)
- `yahooFinanceClient` - Yahoo Finance (fallback)

### Services to Replace

#### 1. Stock Service (stocks-service.ts)

Replace mock data with real APIs:

- `list()` → Finnhub stock list
- `search(query)` → Finnhub symbol search
- `get(symbol)` → Finnhub quote + profile
- `chart(symbol, range)` → Twelvedata time series
- `indices()` → Finnhub + CoinGecko market indices
- `topGainers()` → Finnhub movers endpoint
- `topLosers()` → Finnhub movers endpoint
- `trending()` → High volume stocks from Finnhub

#### 2. Portfolio Service (portfolio-service.ts)

Replace in-memory with persistent storage:

- `holdings()` → localStorage + backend sync
- `add(input)` → Insert to storage
- `remove(id)` → Delete from storage
- `activity()` → Transaction log

#### 3. Watchlist Service (watchlist-service.ts)

Replace in-memory with localStorage:

- `list()` → localStorage read
- `add(symbol)` → localStorage write + fetch latest price
- `remove(symbol)` → localStorage delete

#### 4. News Service (news-service.ts)

Replace mock with NewsAPI:

- `list(category, query)` → NewsAPI search
- `getHeadlines(category)` → NewsAPI headlines
- `getStockNews(symbol)` → NewsAPI search by symbol
- `getTrending()` → NewsAPI popular articles

#### 5. AI Service (ai-service.ts)

Replace hardcoded with Grok LLM:

- `analyze(query)` → Grok LLM call with stock data
- `getRecommendations(symbols)` → Grok multi-stock analysis
- `chat(messages)` → Grok conversation

#### 6. Alerts Service (alerts-service.ts)

Replace in-memory with localStorage:

- `list()` → localStorage read
- `add(input)` → localStorage write
- `remove(id)` → localStorage delete

### Loading & Error Handling

Every service must include:

- Loading state via React Query
- Error handling with user-friendly messages
- Retry logic (exponential backoff)
- Rate limiting awareness
- Fallback data where appropriate

### Environment Variables

All API keys in `.env`:

```
VITE_GROK_API_KEY=xxx
VITE_FINNHUB_API_KEY=xxx
VITE_NEWS_API_KEY=xxx
VITE_TWELVEDATA_API_KEY=xxx
VITE_POLYGON_API_KEY=xxx
```

## Implementation Phases

### Phase 1: Stock Quotes (Days 1-2)

- [ ] Create `finnhub-stocks-service.ts` with real quote fetching
- [ ] Update `stocks-service.ts` to use Finnhub
- [ ] Test on Dashboard + Stocks pages
- [ ] Implement error handling & loading states

### Phase 2: Charts & Indices (Day 2-3)

- [ ] Create `twelvedata-chart-service.ts` for time series
- [ ] Create `indices-service.ts` for market indices + crypto
- [ ] Update stock detail page with real charts
- [ ] Test chart rendering across time ranges

### Phase 3: Portfolio Persistence (Day 3-4)

- [ ] Update `portfolio-service.ts` to use localStorage
- [ ] Implement portfolio calculations with real prices
- [ ] Test add/remove holding functionality
- [ ] Test activity log

### Phase 4: Watchlist Sync (Day 4)

- [ ] Update `watchlist-service.ts` with localStorage
- [ ] Fetch real prices for watchlist items
- [ ] Test watchlist operations

### Phase 5: News Integration (Day 5)

- [ ] Create `newsapi-service.ts` with real news
- [ ] Update `news-service.ts` to use NewsAPI
- [ ] Test news page filtering & search

### Phase 6: AI Enhancement (Day 6)

- [ ] Create `grok-ai-service.ts` with real LLM
- [ ] Implement AI analysis with real market data
- [ ] Test AI page with various queries

### Phase 7: Polish & Testing (Day 7)

- [ ] Implement comprehensive error handling
- [ ] Add loading states to all pages
- [ ] Test rate limiting & caching
- [ ] Performance optimization

## Key Decisions

1. **Portfolio Storage**: Using localStorage for MVP. Add backend later.
2. **Chart Data**: Twelvedata for reliable, detailed data
3. **News**: NewsAPI for breadth + category filtering
4. **AI**: Grok LLM for accurate financial analysis
5. **Fallbacks**: Secondary APIs configured for reliability

## Testing Strategy

- Unit test each service
- Integration test API calls
- E2E test user flows on each page
- Rate limit testing
- Error scenario testing

## Monitoring

Track in production:

- API response times
- Error rates per endpoint
- Rate limit hits
- Data freshness
- Cache hit rates
