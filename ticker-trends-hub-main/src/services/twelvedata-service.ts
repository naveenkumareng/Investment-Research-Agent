import { twelvedataClient, handleApiError, retryRequest } from "@/lib/external-apis";
import type { Stock, TimeRange, PricePoint } from "@/types";

interface TwelvedataQuote {
    symbol: string;
    name: string;
    exchange: string;
    mic_code: string;
    type: string;
    last: number;
    high: number;
    low: number;
    close: number;
    open: number;
    previous_close: number;
    change: number;
    percent_change: number;
    bid: number;
    ask: number;
    bid_size: number;
    ask_size: number;
    volume: number;
    avg_volume: number;
    market_cap: number;
    pe: number;
    eps: number;
    dividend: number;
    yield: number;
    fifty_two_week_high: number;
    fifty_two_week_low: number;
    updated: string;
}

interface TwelvedataTimeseries {
    meta: {
        symbol: string;
        interval: string;
        microbatch_size: number;
        type: string;
    };
    status: string;
    values: Array<{
        datetime: string;
        open: string;
        high: string;
        low: string;
        close: string;
        volume: string;
    }>;
}

interface TwelvedataSearch {
    data: Array<{
        symbol: string;
        name: string;
        currency: string;
        exchange: string;
        mic_code: string;
        country: string;
        type: string;
        figi: string;
    }>;
}

/**
 * Twelvedata Service - Real-time and historical market data
 * REST API: https://api.twelvedata.com
 * WebSocket: wss://ws.twelvedata.com
 * Free tier: 800 requests/day, 5-minute delayed data
 *
 * Supports:
 * - Real-time and delayed quotes
 * - Historical time series data
 * - Intraday and daily intervals
 * - Multiple assets (stocks, ETFs, forex, crypto)
 */

export const twelvedataService = {
    /**
     * Get real-time stock quote
     * Note: Free tier provides 5-minute delayed data
     */
    async getQuote(symbol: string): Promise<Stock | null> {
        try {
            const response = await retryRequest(
                () =>
                    twelvedataClient.get<TwelvedataQuote>("/quote", {
                        params: {
                            symbol: symbol.toUpperCase(),
                            fields:
                                "symbol,name,exchange,last,high,low,open,previous_close,change,percent_change,bid,ask,volume,market_cap,pe,eps,dividend,fifty_two_week_high,fifty_two_week_low",
                        },
                    }),
                3,
                500,
            );

            const quote = response.data;

            if (!quote.last) return null;

            return {
                symbol: symbol.toUpperCase(),
                name: quote.name || symbol,
                exchange: quote.exchange || "UNKNOWN",
                sector: "Unknown", // Twelvedata doesn't provide sector in quote
                industry: "Unknown",
                price: quote.last,
                change: quote.change,
                changePercent: quote.percent_change,
                open: quote.open,
                previousClose: quote.previous_close,
                dayHigh: quote.high,
                dayLow: quote.low,
                volume: quote.volume || 0,
                avgVolume: quote.avg_volume || 0,
                marketCap: quote.market_cap || 0,
                peRatio: quote.pe || 0,
                eps: quote.eps || 0,
                dividend: quote.dividend || 0,
                dividendYield: quote.yield || 0,
                beta: 0,
                currency: "USD",
                weekHigh52: quote.fifty_two_week_high,
                weekLow52: quote.fifty_two_week_low,
            };
        } catch (error) {
            const apiError = handleApiError(error);
            console.error(`Error fetching quote for ${symbol}:`, apiError);
            return null;
        }
    },

    /**
     * Search for stocks, ETFs, forex, crypto
     */
    async search(query: string, type?: "stock" | "etf" | "forex" | "crypto"): Promise<Stock[]> {
        try {
            const response = await retryRequest(
                () =>
                    twelvedataClient.get<TwelvedataSearch>("/symbol_search", {
                        params: {
                            query,
                            type,
                        },
                    }),
                2,
                500,
            );

            const results = response.data.data || [];

            // Get quotes for first 5 results
            const stocks = await Promise.all(
                results.slice(0, 5).map((r) => this.getQuote(r.symbol)),
            );

            return stocks.filter((s): s is Stock => s !== null);
        } catch (error) {
            const apiError = handleApiError(error);
            console.error("Error searching symbols:", apiError);
            return [];
        }
    },

    /**
     * Get historical time series data for charts
     * Supports multiple intervals: 1min, 5min, 15min, 30min, 45min, 1h, 1day, 1week, 1month
     */
    async getChartData(
        symbol: string,
        range: TimeRange = "1M",
        interval: "1min" | "5min" | "15min" | "30min" | "1h" | "1day" | "1week" | "1month" = "1day",
    ): Promise<PricePoint[]> {
        try {
            const outputsize = getOutputSize(range, interval);

            const response = await retryRequest(
                () =>
                    twelvedataClient.get<TwelvedataTimeseries>("/time_series", {
                        params: {
                            symbol: symbol.toUpperCase(),
                            interval,
                            outputsize,
                            type: "bar",
                        },
                    }),
                2,
                500,
            );

            if (response.data.status !== "ok" || !response.data.values) {
                return [];
            }

            return response.data.values.map((value) => ({
                time: new Date(value.datetime).toISOString(),
                price: parseFloat(value.close),
                volume: parseInt(value.volume) || 0,
            }));
        } catch (error) {
            const apiError = handleApiError(error);
            console.error(`Error fetching chart for ${symbol}:`, apiError);
            return [];
        }
    },

    /**
     * Get intraday data (5-minute intervals)
     * Useful for day traders
     */
    async getIntradayData(symbol: string, interval: "5min" | "15min" | "30min" = "5min"): Promise<PricePoint[]> {
        return this.getChartData(symbol, "1D", interval);
    },

    /**
     * Get daily data for technical analysis
     */
    async getDailyData(symbol: string, days: number = 30): Promise<PricePoint[]> {
        const outputsize = Math.min(days, 5000); // API limit
        try {
            const response = await retryRequest(
                () =>
                    twelvedataClient.get<TwelvedataTimeseries>("/time_series", {
                        params: {
                            symbol: symbol.toUpperCase(),
                            interval: "1day",
                            outputsize,
                            type: "bar",
                        },
                    }),
                2,
                500,
            );

            if (response.data.status !== "ok" || !response.data.values) {
                return [];
            }

            return response.data.values.map((value) => ({
                time: new Date(value.datetime).toISOString(),
                price: parseFloat(value.close),
                volume: parseInt(value.volume) || 0,
            }));
        } catch (error) {
            const apiError = handleApiError(error);
            console.error(`Error fetching daily data for ${symbol}:`, apiError);
            return [];
        }
    },

    /**
     * Get weekly data for long-term analysis
     */
    async getWeeklyData(symbol: string, weeks: number = 52): Promise<PricePoint[]> {
        const outputsize = Math.min(weeks, 5000);
        try {
            const response = await retryRequest(
                () =>
                    twelvedataClient.get<TwelvedataTimeseries>("/time_series", {
                        params: {
                            symbol: symbol.toUpperCase(),
                            interval: "1week",
                            outputsize,
                            type: "bar",
                        },
                    }),
                2,
                500,
            );

            if (response.data.status !== "ok" || !response.data.values) {
                return [];
            }

            return response.data.values.map((value) => ({
                time: new Date(value.datetime).toISOString(),
                price: parseFloat(value.close),
                volume: parseInt(value.volume) || 0,
            }));
        } catch (error) {
            const apiError = handleApiError(error);
            console.error(`Error fetching weekly data for ${symbol}:`, apiError);
            return [];
        }
    },

    /**
     * Get monthly data for long-term trends
     */
    async getMonthlyData(symbol: string, months: number = 120): Promise<PricePoint[]> {
        const outputsize = Math.min(months, 5000);
        try {
            const response = await retryRequest(
                () =>
                    twelvedataClient.get<TwelvedataTimeseries>("/time_series", {
                        params: {
                            symbol: symbol.toUpperCase(),
                            interval: "1month",
                            outputsize,
                            type: "bar",
                        },
                    }),
                2,
                500,
            );

            if (response.data.status !== "ok" || !response.data.values) {
                return [];
            }

            return response.data.values.map((value) => ({
                time: new Date(value.datetime).toISOString(),
                price: parseFloat(value.close),
                volume: parseInt(value.volume) || 0,
            }));
        } catch (error) {
            const apiError = handleApiError(error);
            console.error(`Error fetching monthly data for ${symbol}:`, apiError);
            return [];
        }
    },

    /**
     * Get market movers and top gainers/losers
     */
    async getMarketMovers(): Promise<Stock[]> {
        try {
            // Get popular stocks to demonstrate movers
            const popularSymbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "AMD"];

            const movers = await Promise.all(popularSymbols.map((symbol) => this.getQuote(symbol)));

            return movers
                .filter((s): s is Stock => s !== null)
                .sort((a, b) => b.changePercent - a.changePercent);
        } catch (error) {
            const apiError = handleApiError(error);
            console.error("Error fetching market movers:", apiError);
            return [];
        }
    },
};

/**
 * WebSocket Client for Real-time Data
 * Usage:
 * const wsClient = new TwelvedataWebSocket(["AAPL", "MSFT"]);
 * wsClient.on("quote", (data) => console.log(data));
 * wsClient.connect();
 */
export class TwelvedataWebSocket {
    private symbols: string[];
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private listeners: Map<string, Set<Function>> = new Map();
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private isConnecting = false;
    private isConnected = false;

    constructor(symbols: string[]) {
        this.symbols = symbols.map((s) => s.toUpperCase());
        this.setupListeners();
    }

    /**
     * Setup event listeners
     */
    private setupListeners() {
        this.listeners.set("quote", new Set());
        this.listeners.set("error", new Set());
        this.listeners.set("connected", new Set());
        this.listeners.set("disconnected", new Set());
    }

    /**
     * Register event listener
     */
    public on(event: "quote" | "error" | "connected" | "disconnected", callback: Function) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.add(callback);
        }
    }

    /**
     * Unregister event listener
     */
    public off(event: string, callback: Function) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.delete(callback);
        }
    }

    /**
     * Emit event to all listeners
     */
    private emit(event: string, data: any) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach((callback) => callback(data));
        }
    }

    /**
     * Connect to WebSocket
     */
    public connect() {
        if (this.isConnecting || this.isConnected) return;

        this.isConnecting = true;

        try {
            const apiKey = import.meta.env.VITE_TWELVEDATA_API_KEY;
            if (!apiKey) {
                throw new Error("Twelvedata API key not configured");
            }

            const wsUrl = `wss://ws.twelvedata.com/v1/quotes/price?apikey=${apiKey}`;
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => this.onOpen();
            this.ws.onmessage = (event) => this.onMessage(event);
            this.ws.onerror = (error) => this.onError(error);
            this.ws.onclose = () => this.onClose();
        } catch (error) {
            this.emit("error", error);
            this.isConnecting = false;
        }
    }

    /**
     * Handle WebSocket open
     */
    private onOpen() {
        this.isConnecting = false;
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;

        console.log("Twelvedata WebSocket connected");

        // Subscribe to symbols
        this.symbols.forEach((symbol) => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                const message = JSON.stringify({
                    action: "subscribe",
                    params: {
                        symbols: symbol,
                    },
                });
                this.ws.send(message);
            }
        });

        // Setup heartbeat
        this.setupHeartbeat();
        this.emit("connected", { symbols: this.symbols });
    }

    /**
     * Handle WebSocket message
     */
    private onMessage(event: MessageEvent) {
        try {
            const data = JSON.parse(event.data);

            if (data.event === "subscribe_ok" || data.event === "unsubscribe_ok") {
                return;
            }

            if (data.symbol && data.price) {
                this.emit("quote", {
                    symbol: data.symbol,
                    price: parseFloat(data.price),
                    bid: data.bid ? parseFloat(data.bid) : undefined,
                    ask: data.ask ? parseFloat(data.ask) : undefined,
                    timestamp: new Date().toISOString(),
                    exchange: data.exchange,
                });
            }
        } catch (error) {
            this.emit("error", error);
        }
    }

    /**
     * Handle WebSocket error
     */
    private onError(error: Event) {
        console.error("Twelvedata WebSocket error:", error);
        this.emit("error", error);
    }

    /**
     * Handle WebSocket close
     */
    private onClose() {
        this.isConnected = false;
        this.isConnecting = false;
        this.clearHeartbeat();
        this.emit("disconnected", {});

        // Attempt reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            console.log(
                `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`,
            );
            setTimeout(() => this.connect(), delay);
        }
    }

    /**
     * Setup heartbeat to keep connection alive
     */
    private setupHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ action: "heartbeat" }));
            }
        }, 30000); // Every 30 seconds
    }

    /**
     * Clear heartbeat interval
     */
    private clearHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Subscribe to additional symbols
     */
    public subscribe(symbols: string[]) {
        this.symbols.push(...symbols.map((s) => s.toUpperCase()));

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            symbols.forEach((symbol) => {
                const message = JSON.stringify({
                    action: "subscribe",
                    params: {
                        symbols: symbol.toUpperCase(),
                    },
                });
                this.ws!.send(message);
            });
        }
    }

    /**
     * Unsubscribe from symbols
     */
    public unsubscribe(symbols: string[]) {
        const symArray = symbols.map((s) => s.toUpperCase());
        this.symbols = this.symbols.filter((s) => !symArray.includes(s));

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            symArray.forEach((symbol) => {
                const message = JSON.stringify({
                    action: "unsubscribe",
                    params: {
                        symbols: symbol,
                    },
                });
                this.ws!.send(message);
            });
        }
    }

    /**
     * Disconnect WebSocket
     */
    public disconnect() {
        this.clearHeartbeat();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
    }

    /**
     * Check if connected
     */
    public isWebSocketConnected(): boolean {
        return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
    }
}

/**
 * Helper: Get output size based on time range and interval
 */
function getOutputSize(range: TimeRange, interval: string): number {
    // Map time range to approximate number of data points needed
    const rangeMap: Record<TimeRange, number> = {
        "1D": 24, // 1 hour intervals
        "1W": 7, // daily
        "1M": 30, // daily
        "3M": 90, // daily
        "6M": 180, // daily or weekly
        "1Y": 252, // trading days
        "5Y": 1260, // trading days
    };

    const baseSize = rangeMap[range] || 30;

    // Adjust for interval (lower intervals need more data points)
    if (interval.includes("min")) {
        return Math.min(baseSize * 10, 5000);
    } else if (interval === "1h") {
        return Math.min(baseSize * 5, 5000);
    }

    return Math.min(baseSize, 5000);
}
