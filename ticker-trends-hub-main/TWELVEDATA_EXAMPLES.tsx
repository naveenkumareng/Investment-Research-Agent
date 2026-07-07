/**
 * TWELVEDATA INTEGRATION EXAMPLES
 * 
 * This file shows how to use Twelvedata REST API and WebSocket
 * in your React components.
 * 
 * API Endpoints:
 * - REST: https://api.twelvedata.com
 * - WebSocket: wss://ws.twelvedata.com
 */

import { useEffect, useState } from "react";
import { twelvedataService, TwelvedataWebSocket } from "@/services/twelvedata-service";
import type { Stock, PricePoint } from "@/types";

// ============================================================================
// EXAMPLE 1: Simple Stock Quote Using REST API
// ============================================================================

export function SimpleQuoteExample() {
    const [stock, setStock] = useState<Stock | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadQuote = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await twelvedataService.getQuote("AAPL");
                setStock(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load quote");
            } finally {
                setLoading(false);
            }
        };

        loadQuote();
    }, []);

    if (loading) return <div>Loading quote...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!stock) return <div>No data</div>;

    return (
        <div className="border rounded-lg p-4">
            <h2 className="text-2xl font-bold">{stock.name}</h2>
            <p className="text-3xl font-bold text-blue-600">${stock.price.toFixed(2)}</p>
            <p className={`text-lg ${stock.change > 0 ? "text-green-600" : "text-red-600"}`}>
                {stock.change > 0 ? "▲" : "▼"} {Math.abs(stock.change).toFixed(2)} ({stock.changePercent.toFixed(2)}%)
            </p>
            <p className="text-sm text-gray-600">Exchange: {stock.exchange}</p>
            <p className="text-xs text-gray-500">Volume: {(stock.volume / 1e6).toFixed(1)}M</p>
        </div>
    );
}

// ============================================================================
// EXAMPLE 2: Real-time Price Updates with WebSocket
// ============================================================================

export function RealtimePriceExample() {
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [wsConnected, setWsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Create WebSocket client for multiple stocks
        const symbols = ["AAPL", "MSFT", "GOOGL"];
        const wsClient = new TwelvedataWebSocket(symbols);

        wsClient.on("connected", () => {
            console.log("WebSocket connected to Twelvedata");
            setWsConnected(true);
        });

        wsClient.on("quote", (data) => {
            // Update price in real-time
            setPrices((prev) => ({
                ...prev,
                [data.symbol]: data.price,
            }));
        });

        wsClient.on("error", (err) => {
            console.error("WebSocket error:", err);
            setError(String(err));
        });

        wsClient.on("disconnected", () => {
            console.log("WebSocket disconnected");
            setWsConnected(false);
        });

        // Connect to WebSocket
        wsClient.connect();

        // Cleanup on unmount
        return () => {
            wsClient.disconnect();
        };
    }, []);

    return (
        <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Real-time Prices</h2>
                <span className={`px-2 py-1 rounded text-xs ${wsConnected ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                    {wsConnected ? "🟢 Connected" : "🔴 Connecting..."}
                </span>
            </div>

            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

            <div className="space-y-2">
                {Object.entries(prices).map(([symbol, price]) => (
                    <div key={symbol} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="font-semibold">{symbol}</span>
                        <span className="text-lg font-bold text-blue-600">${price.toFixed(2)}</span>
                    </div>
                ))}
            </div>

            <p className="text-xs text-gray-500 mt-4">
                Note: WebSocket provides real-time pricing. Free tier shows 5-minute delayed REST API data.
            </p>
        </div>
    );
}

// ============================================================================
// EXAMPLE 3: Chart Data with Multiple Time Ranges
// ============================================================================

export function ChartDataExample() {
    const [chartData, setChartData] = useState<PricePoint[]>([]);
    const [timeRange, setTimeRange] = useState<"1D" | "1W" | "1M" | "1Y">("1M");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadChart = async () => {
            try {
                setLoading(true);
                const data = await twelvedataService.getChartData("AAPL", timeRange, "1day");
                setChartData(data);
            } finally {
                setLoading(false);
            }
        };

        loadChart();
    }, [timeRange]);

    const stats =
        chartData.length > 0
            ? {
                high: Math.max(...chartData.map((d) => d.price)).toFixed(2),
                low: Math.min(...chartData.map((d) => d.price)).toFixed(2),
                latest: chartData[chartData.length - 1].price.toFixed(2),
                change:
                    (
                        ((chartData[chartData.length - 1].price - chartData[0].price) / chartData[0].price) *
                        100
                    ).toFixed(2),
            }
            : null;

    return (
        <div className="border rounded-lg p-4">
            <h2 className="text-xl font-bold mb-4">AAPL Chart Data</h2>

            {/* Time Range Selector */}
            <div className="flex gap-2 mb-4">
                {(["1D", "1W", "1M", "1Y"] as const).map((range) => (
                    <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-3 py-1 rounded text-sm ${timeRange === range
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                            }`}
                    >
                        {range}
                    </button>
                ))}
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-4 gap-2 mb-4 text-sm">
                    <div className="bg-blue-50 p-2 rounded">
                        <p className="text-gray-600 text-xs">Latest</p>
                        <p className="font-bold">${stats.latest}</p>
                    </div>
                    <div className="bg-green-50 p-2 rounded">
                        <p className="text-gray-600 text-xs">High</p>
                        <p className="font-bold">${stats.high}</p>
                    </div>
                    <div className="bg-red-50 p-2 rounded">
                        <p className="text-gray-600 text-xs">Low</p>
                        <p className="font-bold">${stats.low}</p>
                    </div>
                    <div className={`p-2 rounded ${stats.change > "0" ? "bg-green-50" : "bg-red-50"}`}>
                        <p className="text-gray-600 text-xs">Change</p>
                        <p className={`font-bold ${stats.change > "0" ? "text-green-600" : "text-red-600"}`}>
                            {stats.change}%
                        </p>
                    </div>
                </div>
            )}

            {/* Data Points */}
            {loading ? (
                <p>Loading chart data...</p>
            ) : chartData.length > 0 ? (
                <div className="text-xs text-gray-600">
                    <p>Data points: {chartData.length}</p>
                    <p>Date range: {new Date(chartData[0].time).toLocaleDateString()} to {new Date(chartData[chartData.length - 1].time).toLocaleDateString()}</p>
                </div>
            ) : (
                <p>No data available</p>
            )}
        </div>
    );
}

// ============================================================================
// EXAMPLE 4: Intraday Trading Data (5-minute intervals)
// ============================================================================

export function IntradayTradingExample() {
    const [data, setData] = useState<PricePoint[]>([]);
    const [interval, setInterval] = useState<"5min" | "15min" | "30min">("5min");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadIntraday = async () => {
            try {
                setLoading(true);
                const intradayData = await twelvedataService.getIntradayData("AAPL", interval);
                setData(intradayData);
            } finally {
                setLoading(false);
            }
        };

        loadIntraday();
    }, [interval]);

    return (
        <div className="border rounded-lg p-4">
            <h2 className="text-xl font-bold mb-4">Intraday Trading Data</h2>

            {/* Interval Selector */}
            <div className="flex gap-2 mb-4">
                {(["5min", "15min", "30min"] as const).map((int) => (
                    <button
                        key={int}
                        onClick={() => setInterval(int)}
                        className={`px-3 py-1 rounded text-sm ${interval === int ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
                            }`}
                    >
                        {int}
                    </button>
                ))}
            </div>

            {loading ? (
                <p>Loading intraday data...</p>
            ) : (
                <>
                    <p className="text-sm text-gray-600 mb-3">Last {data.length} candles ({interval})</p>

                    {/* Display last 10 candles */}
                    <div className="space-y-1">
                        {data.slice(-10).map((point) => (
                            <div key={point.time} className="grid grid-cols-3 gap-2 text-xs p-2 bg-gray-50 rounded">
                                <span className="text-gray-600">{new Date(point.time).toLocaleTimeString()}</span>
                                <span className="font-semibold">${point.price.toFixed(2)}</span>
                                <span className="text-gray-500">Vol: {(point.volume / 1e6).toFixed(1)}M</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ============================================================================
// EXAMPLE 5: Stock Search and Comparison
// ============================================================================

export function StockSearchExample() {
    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        try {
            setLoading(true);
            const data = await twelvedataService.search(searchQuery, "stock");
            setResults(data);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="border rounded-lg p-4">
            <h2 className="text-xl font-bold mb-4">Stock Search</h2>

            <form onSubmit={handleSearch} className="mb-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search stocks (e.g., Apple, Microsoft)..."
                        className="flex-1 border rounded px-3 py-2"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                    >
                        {loading ? "Searching..." : "Search"}
                    </button>
                </div>
            </form>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.map((stock) => (
                    <div key={stock.symbol} className="border rounded-lg p-3 hover:shadow-md transition">
                        <h3 className="font-bold">{stock.symbol}</h3>
                        <p className="text-sm text-gray-600">{stock.name}</p>
                        <p className="text-lg font-bold mt-2">${stock.price.toFixed(2)}</p>
                        <p className={`text-sm ${stock.change > 0 ? "text-green-600" : "text-red-600"}`}>
                            {stock.change > 0 ? "▲" : "▼"} {stock.changePercent.toFixed(2)}%
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// EXAMPLE 6: Market Movers Dashboard
// ============================================================================

export function MarketMoversExample() {
    const [movers, setMovers] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMovers = async () => {
            try {
                const data = await twelvedataService.getMarketMovers();
                setMovers(data);
            } finally {
                setLoading(false);
            }
        };

        loadMovers();

        // Refresh every 5 minutes
        const interval = setInterval(loadMovers, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div>Loading movers...</div>;

    return (
        <div className="border rounded-lg p-4">
            <h2 className="text-xl font-bold mb-4">Market Movers</h2>

            <div className="space-y-2">
                {movers.slice(0, 10).map((stock, index) => (
                    <div key={stock.symbol} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                            <p className="font-semibold">#{index + 1} {stock.symbol}</p>
                            <p className="text-xs text-gray-600">{stock.name}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold">${stock.price.toFixed(2)}</p>
                            <p className={`text-sm font-semibold ${stock.change > 0 ? "text-green-600" : "text-red-600"}`}>
                                {stock.change > 0 ? "▲" : "▼"} {stock.changePercent.toFixed(2)}%
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <p className="text-xs text-gray-500 mt-4">Updates every 5 minutes</p>
        </div>
    );
}

// ============================================================================
// EXAMPLE 7: Combined Dashboard (REST + WebSocket)
// ============================================================================

export function CombinedDashboardExample() {
    const [symbol, setSymbol] = useState("AAPL");
    const [stock, setStock] = useState<Stock | null>(null);
    const [rtPrice, setRtPrice] = useState<number | null>(null);
    const [chartData, setChartData] = useState<PricePoint[]>([]);
    const [wsConnected, setWsConnected] = useState(false);

    useEffect(() => {
        // Load REST data
        const loadData = async () => {
            const quoteData = await twelvedataService.getQuote(symbol);
            setStock(quoteData);

            const chart = await twelvedataService.getChartData(symbol, "1M", "1day");
            setChartData(chart);
        };

        loadData();

        // Setup WebSocket
        const wsClient = new TwelvedataWebSocket([symbol]);

        wsClient.on("connected", () => setWsConnected(true));
        wsClient.on("quote", (data) => setRtPrice(data.price));
        wsClient.on("disconnected", () => setWsConnected(false));

        wsClient.connect();

        return () => wsClient.disconnect();
    }, [symbol]);

    if (!stock) return <div>Loading...</div>;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-3xl font-bold">{stock.name}</h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${wsConnected ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        {wsConnected ? "🟢 Live" : "⏱️ 5-min delayed"}
                    </span>
                </div>

                {/* Prices */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">API Price (5-min delayed)</p>
                        <p className="text-3xl font-bold text-blue-600">${stock.price.toFixed(2)}</p>
                    </div>
                    {rtPrice && (
                        <div>
                            <p className="text-sm text-gray-600">WebSocket (Real-time)</p>
                            <p className="text-3xl font-bold text-green-600">${rtPrice.toFixed(2)}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Stock Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="border rounded-lg p-3">
                    <p className="text-xs text-gray-600">Change</p>
                    <p className={`text-lg font-bold ${stock.change > 0 ? "text-green-600" : "text-red-600"}`}>
                        {stock.change > 0 ? "▲" : "▼"} {stock.changePercent.toFixed(2)}%
                    </p>
                </div>
                <div className="border rounded-lg p-3">
                    <p className="text-xs text-gray-600">Volume</p>
                    <p className="text-lg font-bold">{(stock.volume / 1e6).toFixed(1)}M</p>
                </div>
                <div className="border rounded-lg p-3">
                    <p className="text-xs text-gray-600">52W High</p>
                    <p className="text-lg font-bold">${stock.weekHigh52.toFixed(2)}</p>
                </div>
                <div className="border rounded-lg p-3">
                    <p className="text-xs text-gray-600">52W Low</p>
                    <p className="text-lg font-bold">${stock.weekLow52.toFixed(2)}</p>
                </div>
            </div>

            {/* Chart Stats */}
            {chartData.length > 0 && (
                <div className="border rounded-lg p-4 bg-gray-50">
                    <p className="font-semibold mb-2">1-Month Chart Analysis</p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                            <p className="text-gray-600">High</p>
                            <p className="font-bold">${Math.max(...chartData.map((d) => d.price)).toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-gray-600">Low</p>
                            <p className="font-bold">${Math.min(...chartData.map((d) => d.price)).toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-gray-600">Data Points</p>
                            <p className="font-bold">{chartData.length}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
