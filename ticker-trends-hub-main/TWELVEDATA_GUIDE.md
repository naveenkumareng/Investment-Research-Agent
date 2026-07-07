# Twelvedata Integration Guide

Complete guide to using Twelvedata REST API and WebSocket for real-time market data.

---

## 📚 Overview

**Twelvedata** provides:
- Real-time and 5-minute delayed stock quotes
- Historical time series data (intraday, daily, weekly, monthly)
- Multiple asset types (stocks, ETFs, forex, crypto)
- WebSocket for real-time streaming

**Endpoints:**
- REST API: `https://api.twelvedata.com`
- WebSocket: `wss://ws.twelvedata.com`

**Free Tier:**
- 800 API calls per day
- 5-minute delayed data
- Up to 5000 data points per request

---

## 🔑 Setup

### 1. Get API Key
1. Visit: https://twelvedata.com
2. Sign up (free account)
3. Go to dashboard → API Keys
4. Copy your API key

### 2. Add to .env
```env
VITE_TWELVEDATA_API_KEY=your_api_key_here
```

### 3. Restart Dev Server
```bash
npm run dev
```

---

## 💻 REST API Usage

### Get Stock Quote (5-minute delayed)

```typescript
import { twelvedataService } from "@/services/twelvedata-service";

// Get real-time quote (5-min delayed in free tier)
const stock = await twelvedataService.getQuote("AAPL");
console.log(`${stock.symbol}: $${stock.price}`);
console.log(`Change: ${stock.change} (${stock.changePercent}%)`);
console.log(`Volume: ${stock.volume}`);
console.log(`Market Cap: $${stock.marketCap}`);

// Returns:
{
  symbol: "AAPL",
  name: "Apple Inc.",
  price: 150.25,
  change: 2.5,
  changePercent: 1.69,
  dayHigh: 151.00,
  dayLow: 149.50,
  open: 148.75,
  previousClose: 147.75,
  volume: 42000000,
  marketCap: 2500000000000,
  peRatio: 25.4,
  eps: 5.92,
  dividend: 0.24,
  weekHigh52: 200.00,
  weekLow52: 120.00,
  // ... more fields
}
```

### Search for Stocks

```typescript
import { twelvedataService } from "@/services/twelvedata-service";

// Search stocks
const results = await twelvedataService.search("Apple", "stock");
results.forEach(stock => {
  console.log(`${stock.symbol}: ${stock.name}`);
});

// Search with specific type
const etfs = await twelvedataService.search("tech", "etf");
const forexPairs = await twelvedataService.search("EUR/USD", "forex");
const cryptos = await twelvedataService.search("bitcoin", "crypto");
```

### Get Chart Data

```typescript
import { twelvedataService } from "@/services/twelvedata-service";

// Daily data (default)
const dailyData = await twelvedataService.getChartData("AAPL", "1M", "1day");

// Intraday (5-minute intervals)
const intradayData = await twelvedataService.getIntradayData("AAPL", "5min");

// Weekly data
const weeklyData = await twelvedataService.getWeeklyData("AAPL", 52);

// Monthly data
const monthlyData = await twelvedataService.getMonthlyData("AAPL", 120);

// Returns array of:
[
  {
    time: "2024-01-15T10:00:00Z",
    price: 150.25,
    volume: 1000000
  },
  // ... more candles
]
```

### Time Ranges Supported

```typescript
// Daily intervals
"1D"   // 1 day
"1W"   // 1 week
"1M"   // 1 month
"3M"   // 3 months
"6M"   // 6 months
"1Y"   // 1 year
"5Y"   // 5 years

// Intraday intervals
"1min", "5min", "15min", "30min", "1h"

// Example with custom interval:
const data = await twelvedataService.getChartData("AAPL", "1D", "5min");
```

### Get Market Movers

```typescript
import { twelvedataService } from "@/services/twelvedata-service";

const movers = await twelvedataService.getMarketMovers();
// Returns top stocks sorted by percentage change
movers.slice(0, 5).forEach(stock => {
  console.log(`${stock.symbol}: ${stock.changePercent}%`);
});
```

---

## 🔌 WebSocket Real-Time Streaming

### Connect to WebSocket

```typescript
import { TwelvedataWebSocket } from "@/services/twelvedata-service";

// Create WebSocket client
const wsClient = new TwelvedataWebSocket(["AAPL", "MSFT", "GOOGL"]);

// Listen for real-time quotes
wsClient.on("quote", (data) => {
  console.log(`${data.symbol}: $${data.price}`);
  console.log(`Bid: ${data.bid}, Ask: ${data.ask}`);
  console.log(`Updated: ${data.timestamp}`);
});

// Listen for connection events
wsClient.on("connected", ({ symbols }) => {
  console.log(`Connected! Subscribed to: ${symbols.join(", ")}`);
});

wsClient.on("disconnected", () => {
  console.log("Disconnected from WebSocket");
});

wsClient.on("error", (error) => {
  console.error("WebSocket error:", error);
});

// Connect
wsClient.connect();

// Later: subscribe to more symbols
wsClient.subscribe(["TSLA", "META"]);

// Unsubscribe from symbols
wsClient.unsubscribe(["AAPL"]);

// Disconnect
wsClient.disconnect();
```

### WebSocket Quote Structure

```typescript
{
  symbol: "AAPL",           // Stock symbol
  price: 150.25,            // Current price
  bid: 150.23,              // Bid price
  ask: 150.27,              // Ask price
  timestamp: "2024-01-15T10:00:00Z",  // Quote timestamp
  exchange: "NASDAQ"        // Exchange
}
```

---

## 📊 Complete Example Component

```typescript
import { useEffect, useState } from "react";
import { twelvedataService, TwelvedataWebSocket } from "@/services/twelvedata-service";

export function TwelvedataExample() {
  const [stock, setStock] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [rtPrice, setRtPrice] = useState<number | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    // REST API: Get stock quote and chart
    const loadData = async () => {
      const quoteData = await twelvedataService.getQuote("AAPL");
      setStock(quoteData);

      const chart = await twelvedataService.getChartData("AAPL", "1M", "1day");
      setChartData(chart);
    };

    loadData();

    // WebSocket: Real-time price updates
    const wsClient = new TwelvedataWebSocket(["AAPL"]);

    wsClient.on("connected", () => {
      setWsConnected(true);
    });

    wsClient.on("quote", (data) => {
      setRtPrice(data.price);
    });

    wsClient.on("disconnected", () => {
      setWsConnected(false);
    });

    wsClient.connect();

    return () => {
      wsClient.disconnect();
    };
  }, []);

  if (!stock) return <div>Loading...</div>;

  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-2xl font-bold">{stock.name} ({stock.symbol})</h2>

      {/* REST API Data */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-600">Price (5-min delayed)</p>
          <p className="text-2xl font-bold">${stock.price.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-600">Change</p>
          <p className={`text-2xl font-bold ${stock.change > 0 ? "text-green-600" : "text-red-600"}`}>
            {stock.change > 0 ? "+" : ""}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
          </p>
        </div>
      </div>

      {/* Real-time WebSocket Price */}
      {rtPrice && (
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <p className="text-sm text-gray-600">Real-time Price (WebSocket)</p>
          <p className="text-lg font-bold">${rtPrice.toFixed(2)}</p>
          <p className="text-xs text-green-600">{wsConnected ? "✓ Connected" : "✗ Disconnected"}</p>
        </div>
      )}

      {/* Chart Data Stats */}
      {chartData.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <p className="text-sm font-semibold">Chart Data (1 Month)</p>
          <p className="text-xs text-gray-600">Data points: {chartData.length}</p>
          <p className="text-xs">High: ${Math.max(...chartData.map(d => d.price)).toFixed(2)}</p>
          <p className="text-xs">Low: ${Math.min(...chartData.map(d => d.price)).toFixed(2)}</p>
        </div>
      )}

      {/* Market Details */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div>Market Cap: ${(stock.marketCap / 1e12).toFixed(2)}T</div>
        <div>P/E Ratio: {stock.peRatio.toFixed(1)}</div>
        <div>EPS: ${stock.eps.toFixed(2)}</div>
        <div>Volume: {(stock.volume / 1e6).toFixed(1)}M</div>
        <div>52W High: ${stock.weekHigh52.toFixed(2)}</div>
        <div>52W Low: ${stock.weekLow52.toFixed(2)}</div>
      </div>
    </div>
  );
}
```

---

## 🔄 Advanced: Real-time Trading Dashboard

```typescript
import { useEffect, useState } from "react";
import { TwelvedataWebSocket } from "@/services/twelvedata-service";

export function TradingDashboard() {
  const [quotes, setQuotes] = useState<Record<string, any>>({});
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    // Monitor multiple stocks in real-time
    const symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"];
    const wsClient = new TwelvedataWebSocket(symbols);

    wsClient.on("connected", () => {
      console.log("Dashboard connected to real-time feed");
      setWsConnected(true);
    });

    wsClient.on("quote", (data) => {
      setQuotes((prev) => ({
        ...prev,
        [data.symbol]: {
          price: data.price,
          bid: data.bid,
          ask: data.ask,
          timestamp: data.timestamp,
          spread: (data.ask - data.bid).toFixed(4),
        },
      }));
    });

    wsClient.on("disconnected", () => {
      console.log("Dashboard disconnected");
      setWsConnected(false);
    });

    wsClient.connect();

    // Subscribe to additional symbols after 5 seconds
    setTimeout(() => {
      wsClient.subscribe(["META", "NVDA"]);
    }, 5000);

    return () => {
      wsClient.disconnect();
    };
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Real-time Trading Dashboard</h2>
        <span className={`px-3 py-1 rounded ${wsConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {wsConnected ? "🟢 Live" : "🔴 Offline"}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(quotes).map(([symbol, data]: [string, any]) => (
          <div key={symbol} className="border rounded-lg p-4 hover:shadow-lg transition">
            <h3 className="font-bold text-lg">{symbol}</h3>
            <p className="text-2xl font-bold text-blue-600">${data.price.toFixed(2)}</p>
            <div className="text-xs text-gray-600 mt-2">
              <p>Bid: ${data.bid?.toFixed(2)} | Ask: ${data.ask?.toFixed(2)}</p>
              <p>Spread: ${data.spread}</p>
              <p className="text-gray-400">{data.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 📈 Technical Analysis Example

```typescript
import { useEffect, useState } from "react";
import { twelvedataService } from "@/services/twelvedata-service";

export function TechnicalAnalysis({ symbol }: { symbol: string }) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const analyze = async () => {
      // Get 30 days of daily data for technical analysis
      const chartData = await twelvedataService.getDailyData(symbol, 30);

      // Calculate technical indicators
      const withIndicators = chartData.map((point, index, arr) => {
        // Simple Moving Average (10-day)
        const sma10 = index >= 9
          ? arr.slice(index - 9, index + 1).reduce((sum, p) => sum + p.price, 0) / 10
          : null;

        // Simple Moving Average (20-day)
        const sma20 = index >= 19
          ? arr.slice(index - 19, index + 1).reduce((sum, p) => sum + p.price, 0) / 20
          : null;

        return {
          ...point,
          sma10,
          sma20,
        };
      });

      setData(withIndicators);
    };

    analyze();
  }, [symbol]);

  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-xl font-bold mb-4">{symbol} - Technical Analysis</h3>

      <div className="space-y-2 text-sm">
        {data.slice(-10).map((point) => (
          <div key={point.time} className="grid grid-cols-4 gap-2">
            <span className="text-gray-600">{new Date(point.time).toLocaleDateString()}</span>
            <span className="font-semibold">${point.price.toFixed(2)}</span>
            <span className="text-blue-600">SMA10: ${point.sma10?.toFixed(2)}</span>
            <span className="text-purple-600">SMA20: ${point.sma20?.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🎯 Use Cases

### 1. Real-time Price Ticker
Use WebSocket to stream live prices

### 2. Day Trading Dashboard
5-minute intraday data + real-time prices

### 3. Portfolio Monitor
Track multiple stocks simultaneously

### 4. Technical Analysis
Historical daily/weekly data for indicators

### 5. Market Screening
Search and compare multiple assets

---

## ⚠️ Important Notes

**Free Tier Limitations:**
- 800 API calls per day
- 5-minute delayed quotes (not real-time)
- No historical data older than 2 years
- WebSocket may have limited features

**Rate Limiting:**
- Plan requests carefully
- Implement caching (5-30 minutes)
- Use WebSocket for real-time updates instead of polling

**Data Quality:**
- Verify data during market hours
- Handle missing/delayed data gracefully
- Test with different asset types

---

## 🔗 API Reference

### REST Methods

```typescript
// Get quote
await twelvedataService.getQuote(symbol)

// Search
await twelvedataService.search(query, type?)

// Chart data
await twelvedataService.getChartData(symbol, range?, interval?)

// Specific intervals
await twelvedataService.getIntradayData(symbol, interval?)
await twelvedataService.getDailyData(symbol, days?)
await twelvedataService.getWeeklyData(symbol, weeks?)
await twelvedataService.getMonthlyData(symbol, months?)

// Market overview
await twelvedataService.getMarketMovers()
```

### WebSocket Methods

```typescript
// Create client
new TwelvedataWebSocket(symbols)

// Events
wsClient.on("quote", callback)
wsClient.on("connected", callback)
wsClient.on("disconnected", callback)
wsClient.on("error", callback)

// Operations
wsClient.connect()
wsClient.disconnect()
wsClient.subscribe(symbols)
wsClient.unsubscribe(symbols)
wsClient.isWebSocketConnected()
```

---

## 📞 Support

- Twelvedata Docs: https://twelvedata.com/docs
- API Status: https://status.twelvedata.com
- Support: support@twelvedata.com

---

## 🚀 Next Steps

1. Get API key from twelvedata.com
2. Add to .env: `VITE_TWELVEDATA_API_KEY=your_key`
3. Start with REST API examples
4. Add WebSocket for real-time updates
5. Build your trading application

Happy trading! 📈
