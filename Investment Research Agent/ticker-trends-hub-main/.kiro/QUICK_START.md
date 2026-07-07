# Quick Start - Production API Migration

## Current Status ✅

All new production-ready services are created and ready to integrate.

**Created Files:**

- ✅ `src/services/finnhub-stocks-service.ts` - Real stock data
- ✅ `src/services/grok-ai-service.ts` - LLM analysis
- ✅ `src/services/newsapi-service.ts` - Real news
- ✅ `src/services/portfolio-service-persistent.ts` - Portfolio management
- ✅ `src/services/watchlist-service-persistent.ts` - Watchlist management
- ✅ `src/services/alerts-service-persistent.ts` - Alert management
- ✅ `src/lib/external-apis.ts` - Fixed TypeScript issues

## Next Steps (Priority Order)

### 1. Create CoinGecko Service (30 min)

**Purpose**: Market indices and crypto data

```bash
# File: src/services/coingecko-service.ts
```

Create this service with:

- `getMarketIndices()` - S&P, NASDAQ, Crypto prices
- `getCryptoPrices()` - BTC, ETH, etc.
- `getGlobalMarketData()` - Market caps, volumes

### 2. Update Existing Services (1-2 hours)

#### stocks-service.ts

```typescript
// Replace entire file
import { finnhubStocksService } from "./finnhub-stocks-service";
import { coinGeckoService } from "./coingecko-service";

export const stocksService = {
  async list(): Promise<Stock[]> {
    // Implement using Finnhub with caching
    // Return top ~50 stocks
  },
  async search(query: string): Promise<Stock[]> {
    return finnhubStocksService.search(query);
  },
  // ... rest
};
```

#### portfolio-service.ts

```typescript
// Replace entire file
export { portfolioService } from "./portfolio-service-persistent";
```

#### watchlist-service.ts

```typescript
// Replace entire file
export { watchlistService } from "./watchlist-service-persistent";
```

#### news-service.ts

```typescript
// Replace
import { newsApiService } from "./newsapi-service";

export const newsService = {
  async list(category?: string, query?: string) {
    if (query) {
      return newsApiService.search(query, category);
    }
    return newsApiService.getHeadlines(category);
  },
};
```

#### ai-service.ts

```typescript
// Replace
import { grokAiService } from "./grok-ai-service";

export const aiService = {
  async analyze(query: string) {
    return grokAiService.analyze(query);
  },
};
```

#### alerts-service.ts

```typescript
// Replace
export { alertsService } from "./alerts-service-persistent";
```

### 3. Add Loading States (1 hour)

For each page, add loading components:

```typescript
if (isLoading) return <StockListSkeleton />;
if (error) return <ErrorAlert error={error} onRetry={refetch} />;
if (!data?.length) return <EmptyState />;
```

### 4. Test Each Feature (2 hours)

**Test Checklist:**

- [ ] Dashboard loads with real data
- [ ] Stock search returns results
- [ ] Stock detail shows real quote & chart
- [ ] Portfolio add/remove works
- [ ] Watchlist add/remove works
- [ ] News filters work
- [ ] AI analysis responds
- [ ] Error handling shows messages
- [ ] Refresh shows fresh data
- [ ] localStorage persists correctly

### 5. Optimize & Polish (1 hour)

- Add error boundaries
- Implement retry buttons
- Improve error messages
- Add loading skeletons
- Cache optimization

## Testing Commands

### Test Individual Services

```typescript
// In browser console

// Test Finnhub
const stock = await finnhubStocksService.getQuote("AAPL");
console.log("Stock:", stock);

// Test Grok AI
const insight = await grokAiService.analyze("What about Tesla?");
console.log("AI Insight:", insight);

// Test NewsAPI
const news = await newsApiService.search("Apple", "technology");
console.log("News:", news);

// Test Portfolio
const holdings = await portfolioService.holdings();
console.log("Holdings:", holdings);

// Test Watchlist
const watchlist = await watchlistService.list();
console.log("Watchlist:", watchlist);

// Check localStorage
console.log("Holdings stored:", JSON.parse(localStorage.getItem("investment_dashboard_holdings")));
```

## Environment Setup

Ensure `.env` file in root directory:

```dotenv
# Free Tier - Get from:
# - Finnhub: https://finnhub.io
# - NewsAPI: https://newsapi.org
# - Grok: https://console.x.ai
# - Twelvedata: https://twelvedata.com
# - Polygon: https://polygon.io

VITE_FINNHUB_API_KEY=
VITE_NEWS_API_KEY=
VITE_GROK_API_KEY=
VITE_TWELVEDATA_API_KEY=
VITE_POLYGON_API_KEY=
```

## Common Issues & Fixes

### Issue: API keys showing as undefined

**Fix**: Ensure keys are in `.env` file and server is restarted

### Issue: CORS errors

**Fix**: Not applicable - all APIs support CORS from browsers

### Issue: Rate limiting (429 errors)

**Fix**: Implement caching and request debouncing

### Issue: Empty charts

**Fix**: Check date ranges, ensure historical data available

### Issue: localStorage full

**Fix**: Clear old data, implement cleanup on app startup

## Performance Tips

1. **Reduce API calls**
   - Implement 5-min cache for quotes
   - Use React Query deduplication
   - Batch requests where possible

2. **Lazy load charts**
   - Load chart data only on tab click
   - Limit to 1000 data points per chart

3. **Paginate long lists**
   - 20 items per page for news
   - Load more on scroll

4. **Compress images**
   - Cache company logos
   - Resize before display

## Monitoring & Logs

Check browser console for:

- API errors and responses
- Rate limit warnings
- localStorage operations
- Performance timings

## Production Checklist

- [ ] All API keys configured
- [ ] Error handling on all pages
- [ ] Loading states for all data
- [ ] Offline fallback working
- [ ] Cache strategy implemented
- [ ] No console errors
- [ ] Performance acceptable (<2s load)
- [ ] All features tested
- [ ] Rate limits handled
- [ ] User notifications clear

## Support

For issues:

1. Check `src/lib/external-apis.ts` for API client errors
2. Monitor browser Network tab
3. Check localStorage in DevTools
4. Review component logs
5. Check API documentation:
   - Finnhub: https://finnhub.io/docs/api
   - NewsAPI: https://newsapi.org/docs
   - Grok: https://x.ai/documentation
   - CoinGecko: https://docs.coingecko.com/reference

## File Structure

```
Investment Research Agent/
├── ticker-trends-hub-main/
│   ├── .kiro/
│   │   ├── PRODUCTION_CONVERSION.md
│   │   ├── IMPLEMENTATION_GUIDE.md
│   │   ├── ARCHITECTURE.md
│   │   └── QUICK_START.md (this file)
│   ├── src/
│   │   ├── lib/
│   │   │   └── external-apis.ts ✅ (Fixed)
│   │   └── services/
│   │       ├── finnhub-stocks-service.ts ✅
│   │       ├── grok-ai-service.ts ✅
│   │       ├── newsapi-service.ts ✅
│   │       ├── portfolio-service-persistent.ts ✅
│   │       ├── watchlist-service-persistent.ts ✅
│   │       ├── alerts-service-persistent.ts ✅
│   │       └── [existing services to update]
│   ├── .env (API keys here)
│   └── ...
```

## Success Criteria

✅ Production-Ready When:

- No mock data displayed
- All data from real APIs
- localStorage used for persistence
- Error messages user-friendly
- Loading states on every page
- Performance acceptable
- Rate limits handled
- Tests passing

## Timeline Estimate

**Total**: 8-10 hours of work

- Service creation: ✅ Done (4 hours)
- Service integration: 2 hours
- Loading states: 1 hour
- Testing: 2 hours
- Polish: 1 hour

Ready to start? Pick any file from "Next Steps" above!
