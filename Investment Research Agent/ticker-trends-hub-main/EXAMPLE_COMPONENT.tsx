/**
 * EXAMPLE COMPONENT - Shows how to use all integrated APIs
 * This is a reference implementation demonstrating best practices
 *
 * Copy patterns from this file into your actual components
 */

import { useState, useEffect } from "react";
import { grokAiService } from "@/services/grok-ai-service";
import { finnhubStocksService } from "@/services/finnhub-stocks-service";
import { newsApiService } from "@/services/newsapi-service";
import type { Stock, AIInsight, NewsArticle } from "@/types";

// ============================================================================
// EXAMPLE 1: Stock Quote Component
// ============================================================================

export function StockQuoteExample({ symbol }: { symbol: string }) {
  const [stock, setStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStock = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await finnhubStocksService.getQuote(symbol);
        setStock(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stock");
      } finally {
        setLoading(false);
      }
    };

    loadStock();
  }, [symbol]);

  if (loading) return <div>Loading stock data...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!stock) return <div>Stock not found</div>;

  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-xl font-bold">{stock.name}</h2>
      <p className="text-2xl">${stock.price.toFixed(2)}</p>
      <p className={stock.change > 0 ? "text-green-600" : "text-red-600"}>
        {stock.change > 0 ? "+" : ""}
        {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div>Open: ${stock.open.toFixed(2)}</div>
        <div>High: ${stock.dayHigh.toFixed(2)}</div>
        <div>Low: ${stock.dayLow.toFixed(2)}</div>
        <div>Volume: {(stock.volume / 1_000_000).toFixed(1)}M</div>
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: AI Analysis Component
// ============================================================================

export function AIAnalysisExample({ query }: { query: string }) {
  const [analysis, setAnalysis] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await grokAiService.analyze(query);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? "Analyzing..." : "Get AI Analysis"}
      </button>

      {error && <div className="text-red-500 mt-2">{error}</div>}

      {analysis && (
        <div className="mt-4">
          <h3 className="font-bold">{analysis.title}</h3>
          <p className="text-sm mt-2">{analysis.content}</p>

          <div className="mt-4 flex gap-4">
            <div>
              <span className="text-xs text-gray-500">Sentiment</span>
              <p className="font-bold capitalize">{analysis.sentiment}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Score</span>
              <p className="font-bold">{analysis.score.toFixed(0)}/100</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs text-gray-500">Key Points:</p>
            <ul className="list-disc ml-4">
              {analysis.keyPoints.map((point, i) => (
                <li key={i} className="text-sm">
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: News Feed Component
// ============================================================================

export function NewsFeedExample({ query }: { query: string }) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadNews = async () => {
      try {
        setLoading(true);
        setError(null);
        const results = await newsApiService.search(query);
        setArticles(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load news");
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, [query]);

  if (loading) return <div>Loading news...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (articles.length === 0) return <div>No articles found</div>;

  return (
    <div className="space-y-4">
      {articles.map((article) => (
        <article key={article.id} className="border rounded-lg p-4 hover:shadow-lg transition">
          {article.image && (
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-40 object-cover rounded mb-2"
            />
          )}

          <h3 className="font-bold text-lg">{article.title}</h3>
          <p className="text-sm text-gray-600 mt-2">{article.summary}</p>

          <div className="mt-3 flex justify-between items-center text-xs">
            <span className="text-gray-500">{article.source}</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded capitalize">
              {article.category}
            </span>
          </div>

          <div className="mt-2 text-xs text-gray-400">
            {new Date(article.date).toLocaleDateString()}
          </div>

          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline text-sm mt-2"
          >
            Read More →
          </a>
        </article>
      ))}
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Stock Search Component
// ============================================================================

export function StockSearchExample() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const data = await finnhubStocksService.search(searchQuery);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSearch} className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search stocks..."
          className="border rounded px-3 py-2 w-full"
        />
        <button
          type="submit"
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <div className="text-red-500">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((stock) => (
          <div key={stock.symbol} className="border rounded-lg p-3">
            <p className="font-bold">{stock.symbol}</p>
            <p className="text-sm text-gray-600">{stock.name}</p>
            <p className="mt-2 text-lg font-bold">${stock.price.toFixed(2)}</p>
            <p className={stock.change > 0 ? "text-green-600 text-sm" : "text-red-600 text-sm"}>
              {stock.change > 0 ? "↑" : "↓"} {Math.abs(stock.changePercent).toFixed(2)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Chart Data Component
// ============================================================================

export function ChartDataExample({ symbol }: { symbol: string }) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<"1D" | "1W" | "1M" | "1Y">("1M");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChart = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await finnhubStocksService.getChartData(symbol, timeRange);
        setChartData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load chart");
      } finally {
        setLoading(false);
      }
    };

    loadChart();
  }, [symbol, timeRange]);

  return (
    <div className="border rounded-lg p-4">
      <div className="flex gap-2 mb-4">
        {(["1D", "1W", "1M", "1Y"] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1 rounded ${timeRange === range ? "bg-blue-500 text-white" : "bg-gray-200"}`}
          >
            {range}
          </button>
        ))}
      </div>

      {loading && <div>Loading chart data...</div>}
      {error && <div className="text-red-500">{error}</div>}

      {chartData.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Data points: {chartData.length} | High: $
            {Math.max(...chartData.map((d) => d.price)).toFixed(2)} | Low: $
            {Math.min(...chartData.map((d) => d.price)).toFixed(2)}
          </p>

          {/* Replace with actual charting library like Recharts */}
          <div className="text-xs text-gray-500 mt-2">
            [Install Recharts to render actual charts: npm install recharts]
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: Combined Dashboard Component
// ============================================================================

export function DashboardExample() {
  const [selectedStock, setSelectedStock] = useState("AAPL");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
      {/* Stock Quote */}
      <div className="lg:col-span-1">
        <h2 className="text-xl font-bold mb-4">Stock Quote</h2>
        <StockQuoteExample symbol={selectedStock} />
      </div>

      {/* AI Analysis & Chart */}
      <div className="lg:col-span-2 space-y-4">
        <div>
          <h2 className="text-xl font-bold mb-4">AI Analysis</h2>
          <AIAnalysisExample query={selectedStock} />
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Price Chart</h2>
          <ChartDataExample symbol={selectedStock} />
        </div>
      </div>

      {/* News Feed */}
      <div className="lg:col-span-3">
        <h2 className="text-xl font-bold mb-4">Related News</h2>
        <NewsFeedExample query={selectedStock} />
      </div>

      {/* Stock Search */}
      <div className="lg:col-span-3">
        <h2 className="text-xl font-bold mb-4">Search Stocks</h2>
        <StockSearchExample />
      </div>
    </div>
  );
}

// ============================================================================
// USAGE IN YOUR APP
// ============================================================================

/*
// Import in your route/page:
import { 
  DashboardExample,
  StockQuoteExample,
  AIAnalysisExample,
  NewsFeedExample 
} from "@/EXAMPLE_COMPONENT";

// Use in component:
export function MyPage() {
  return <DashboardExample />;
}

// Or use individual components:
export function MyPage() {
  return (
    <div>
      <StockQuoteExample symbol="AAPL" />
      <AIAnalysisExample query="Should I buy Apple stock?" />
      <NewsFeedExample query="tech stocks" />
    </div>
  );
}
*/
