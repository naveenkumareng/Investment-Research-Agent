# Twelvedata Quick Start - 5 Minutes to Live Prices

Get real-time stock prices and historical data working in 5 minutes.

---

## ⚡ Step 1: Get API Key (2 minutes)

1. Go to: https://twelvedata.com
2. Click "Sign up" (free account)
3. Verify email
4. Dashboard → Settings → API Keys
5. Copy your API key

---

## 📝 Step 2: Add to .env (1 minute)

Open `.env` file and add:
```env
VITE_TWELVEDATA_API_KEY=your_api_key_here
```

Replace `your_api_key_here` with your actual key.

---

## 🔄 Step 3: Restart Dev Server (1 minute)

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## 💻 Step 4: Use in Component (1 minute)

### Option A: Get Stock Quote
```typescript
import { twelvedataService } from "@/services/twelvedata-service";

async function getStockPrice() {
  const stock = await twelvedataService.getQuote("AAPL");
  console.log(`${stock.name}: $${stock.price}`);
  console.log(`Change: ${stock.changePercent}%`);
}

getStockPrice();
```

### Option B: Real-time WebSocket
```typescript
import { TwelvedataWebSocket } from "@/services/twelvedata-service";

const ws = new TwelvedataWebSocket(["AAPL", "MSFT"]);

ws.on("quote", (data) => {
  console.log(`${data.symbol}: $${data.price}`);
});

ws.on("connected", () => {
  console.log("✅ Connected to real-time prices");
});

ws.connect();
```

### Option C: Copy a Component Example
See `TWELVEDATA_EXAMPLES.tsx` for 7 working examples:
- `SimpleQuoteExample()` - Basic quote display
- `RealtimePriceExample()` - WebSocket streaming
- `ChartDataExample()` - Historical data
- And 4 more...

---

## 🎯 What You Can Do Now

| Task | Code |
|------|------|
| Get current price | `twelvedataService.getQuote("AAPL")` |
| Get 5-day chart | `twelvedataService.getChartData("AAPL", "1W")` |
| Get 5-min intraday | `twelvedataService.getIntradayData("AAPL", "5min")` |
| Search stock | `twelvedataService.search("Apple")` |
| Real-time stream | `new TwelvedataWebSocket(["AAPL"]).connect()` |
| Market movers | `twelvedataService.getMarketMovers()` |

---

## 🔌 API vs WebSocket

### REST API (Simple, 5-min delayed)
```typescript
const stock = await twelvedataService.getQuote("AAPL");
// Get price, volume, change, etc.
// 5-minute delayed on free tier
```

✅ Good for: Historical data, backtesting, technical analysis  
❌ Not for: Real-time trading

### WebSocket (Real-time, no delay)
```typescript
const ws = new TwelvedataWebSocket(["AAPL"]);
ws.on("quote", (data) => {
  // Real-time price, bid, ask
  console.log(data.price);
});
ws.connect();
```

✅ Good for: Live trading, real-time dashboards  
❌ Limited to: Live WebSocket features

---

## 📊 Examples by Use Case

### Day Trader
```typescript
// Get 5-minute candles
const data = await twelvedataService.getIntradayData("AAPL", "5min");
// Use for technical analysis, support/resistance, etc.

// Stream real-time prices
const ws = new TwelvedataWebSocket(["AAPL"]);
ws.on("quote", executeTradeLogic);
ws.connect();
```

### Portfolio Manager
```typescript
// Monitor multiple stocks
const symbols = ["AAPL", "MSFT", "GOOGL", "AMZN"];
const quotes = await Promise.all(
  symbols.map(s => twelvedataService.getQuote(s))
);

// Stream updates
const ws = new TwelvedataWebSocket(symbols);
ws.on("quote", updatePortfolio);
ws.connect();
```

### Technical Analyst
```typescript
// Get historical data for analysis
const daily = await twelvedataService.getDailyData("AAPL", 100);
const weekly = await twelvedataService.getWeeklyData("AAPL", 52);
const monthly = await twelvedataService.getMonthlyData("AAPL", 120);

// Calculate indicators (SMA, RSI, MACD, etc.)
```

### News Trader
```typescript
// Get quotes before important events
const quote = await twelvedataService.getQuote("AAPL");

// Monitor real-time price movement
const ws = new TwelvedataWebSocket(["AAPL"]);
ws.on("quote", (data) => {
  if (Math.abs(data.price - quote.price) > 2) {
    console.log("Major price move detected!");
  }
});
ws.connect();
```

---

## ⚠️ Common Issues

### "API key not found"
```
❌ Error: VITE_TWELVEDATA_API_KEY is undefined
```
**Fix:** Add key to `.env` and restart dev server

### "Rate limit exceeded (800/day)"
```
❌ Error: Rate limit for 800 calls/day exceeded
```
**Fix:** 
- Implement caching (5-30 minutes)
- Use WebSocket instead of polling
- Batch requests together

### "5-minute delayed prices"
```
✅ Expected behavior on free tier
```
**Solutions:**
- Upgrade to paid plan for real-time REST
- Use WebSocket for true real-time (no delay)

### "WebSocket won't connect"
```
❌ Error: WebSocket connection failed
```
**Fix:**
- Verify API key is correct
- Check network/firewall
- Try REST API as fallback

---

## 📚 Data Types

### Stock Quote
```typescript
{
  symbol: "AAPL",           // Stock ticker
  name: "Apple Inc.",       // Company name
  price: 150.25,           // Current price
  change: 2.5,             // Dollar change
  changePercent: 1.69,     // Percentage change
  volume: 42000000,        // Trading volume
  dayHigh: 151.00,         // Day high
  dayLow: 149.50,          // Day low
  marketCap: 2.5e12        // Market capitalization
}
```

### Price Point (Chart Data)
```typescript
{
  time: "2024-01-15T10:00:00Z",  // OHLCV time
  price: 150.25,                  // Close price
  volume: 1000000                 // Volume
}
```

### WebSocket Quote
```typescript
{
  symbol: "AAPL",              // Ticker
  price: 150.25,               // Real-time price
  bid: 150.23,                 // Bid price
  ask: 150.27,                 // Ask price
  timestamp: "2024-01-15T..."  // Server timestamp
}
```

---

## 🎓 Copy-Paste Examples

### Example 1: Display Stock Price in React
```typescript
import { useEffect, useState } from "react";
import { twelvedataService } from "@/services/twelvedata-service";

export function StockPrice() {
  const [price, setPrice] = useState(null);

  useEffect(() => {
    twelvedataService.getQuote("AAPL").then(stock => {
      setPrice(stock.price);
    });
  }, []);

  return <div>AAPL: ${price?.toFixed(2)}</div>;
}
```

### Example 2: Real-time Price Updates
```typescript
import { useEffect, useState } from "react";
import { TwelvedataWebSocket } from "@/services/twelvedata-service";

export function LivePrice() {
  const [price, setPrice] = useState(null);

  useEffect(() => {
    const ws = new TwelvedataWebSocket(["AAPL"]);
    ws.on("quote", (data) => setPrice(data.price));
    ws.connect();
    return () => ws.disconnect();
  }, []);

  return <div>AAPL Live: ${price?.toFixed(2)}</div>;
}
```

### Example 3: Chart Data
```typescript
import { useEffect, useState } from "react";
import { twelvedataService } from "@/services/twelvedata-service";

export function StockChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    twelvedataService.getChartData("AAPL", "1M").then(setData);
  }, []);

  return (
    <div>
      {data.slice(-5).map(point => (
        <div key={point.time}>
          {new Date(point.time).toLocaleDateString()}: ${point.price}
        </div>
      ))}
    </div>
  );
}
```

---

## 🚀 Production Tips

✅ **Cache Results** (5-30 minutes)
- Reduces API calls
- Improves performance
- Respects rate limits

✅ **Use WebSocket** for live prices
- No rate limit impact
- No delay
- Perfect for trading

✅ **Batch Requests**
```typescript
// Good: 3 calls
const [a, b, c] = await Promise.all([
  getQuote("AAPL"),
  getQuote("MSFT"),
  getQuote("GOOGL")
]);

// Bad: 300 calls
for (let i = 0; i < 100; i++) {
  await getQuote("AAPL");
}
```

✅ **Handle Errors**
```typescript
try {
  const stock = await twelvedataService.getQuote("AAPL");
} catch (error) {
  console.error("Failed to get quote:", error);
  // Fallback logic
}
```

---

## 📖 Next Steps

1. **Read Full Guides**
   - `TWELVEDATA_GUIDE.md` (comprehensive)
   - `TWELVEDATA_EXAMPLES.tsx` (working code)

2. **Explore Advanced Features**
   - Multiple time intervals
   - Intraday data
   - Asset search
   - Market movers

3. **Build Your App**
   - Use components as templates
   - Combine REST + WebSocket
   - Add your business logic
   - Deploy to production

---

## 🔗 Resources

- **Twelvedata Docs**: https://twelvedata.com/docs
- **API Reference**: https://twelvedata.com/api
- **WebSocket Docs**: https://twelvedata.com/docs#websockets
- **Free Tier Details**: https://twelvedata.com/pricing
- **Status Page**: https://status.twelvedata.com

---

## ✅ Checklist

- [ ] Get Twelvedata API key
- [ ] Add to `.env` file
- [ ] Restart dev server
- [ ] Test with REST API example
- [ ] Test with WebSocket example
- [ ] Copy component example into your app
- [ ] Build your feature
- [ ] Deploy to production

**That's it! You're ready.** 🎉
