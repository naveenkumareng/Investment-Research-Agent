import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, Building2, ExternalLink, Star, Users } from "lucide-react";
import { toast } from "sonner";

import { stocksService } from "@/services/stocks-service";
import { watchlistService } from "@/services/watchlist-service";
import { aiService } from "@/services/ai-service";
import { ChangeBadge } from "@/components/common/change-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatNumber } from "@/utils/format";
import type { TimeRange } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/stocks/$symbol")({
  component: StockDetail,
  head: ({ params }) => ({
    meta: [
      { title: `${params.symbol} — Investa` },
      {
        name: "description",
        content: `Live price, charts, financials, news and AI analysis for ${params.symbol}.`,
      },
    ],
  }),
});

const RANGES: TimeRange[] = ["1D", "1W", "1M", "6M", "1Y", "5Y", "MAX"];

function StockDetail() {
  const { symbol } = Route.useParams();
  const [range, setRange] = useState<TimeRange>("1M");
  const qc = useQueryClient();

  const { data: stock } = useQuery({
    queryKey: ["stock", symbol],
    queryFn: () => stocksService.get(symbol),
  });
  const { data: chart = [] } = useQuery({
    queryKey: ["stock-chart", symbol, range],
    queryFn: () => stocksService.chart(symbol, range),
  });
  const { data: watchlist = [] } = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => watchlistService.list(),
  });
  const inWatchlist = watchlist.some((w) => w.symbol === symbol);

  const toggleWatch = async () => {
    try {
      if (inWatchlist) {
        await watchlistService.remove(symbol);
        toast.success(`Removed ${symbol} from watchlist`);
      } else {
        await watchlistService.add(symbol);
        toast.success(`Added ${symbol} to watchlist`);
      }
      qc.invalidateQueries({ queryKey: ["watchlist"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  if (!stock) {
    return (
      <div className="p-6">
        <div className="animate-pulse text-sm text-muted-foreground">Loading {symbol}…</div>
      </div>
    );
  }

  const up = stock.changePercent >= 0;

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4 lg:p-6">
      <Link
        to="/stocks"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> All stocks
      </Link>

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border bg-card p-5 md:flex-row md:items-start">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 font-mono font-bold text-primary">
              {stock.symbol.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold">{stock.symbol}</h1>
                <span className="rounded bg-muted px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                  {stock.exchange}
                </span>
                <span className="rounded bg-muted px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                  {stock.currency}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {stock.name} · {stock.sector} / {stock.industry}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-end gap-3">
            <span className={cn("tabular text-4xl font-semibold", up ? "text-bull" : "text-bear")}>
              {formatCurrency(stock.price, stock.currency)}
            </span>
            <ChangeBadge value={stock.change} size="lg" />
            <ChangeBadge value={stock.changePercent} percent size="lg" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={toggleWatch}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium",
              inWatchlist
                ? "border-primary/40 bg-primary/10 text-primary"
                : "hover:bg-surface-elevated",
            )}
          >
            <Star className={cn("h-3.5 w-3.5", inWatchlist && "fill-current")} />
            {inWatchlist ? "In Watchlist" : "Add to Watchlist"}
          </button>
          <Link
            to="/ai"
            search={{ q: stock.symbol }}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            AI Analyze
          </Link>
        </div>
      </div>

      {/* Chart + Key Stats */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold">Price chart</div>
            <div className="flex flex-wrap gap-1">
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    "rounded px-2 py-1 text-[11px] font-semibold tracking-wider",
                    range === r
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="detail-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={up ? "var(--color-bull)" : "var(--color-bear)"}
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="100%"
                      stopColor={up ? "var(--color-bull)" : "var(--color-bear)"}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="time"
                  tickFormatter={(v) =>
                    new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                  }
                  stroke="var(--color-muted-foreground)"
                  fontSize={10}
                />
                <YAxis
                  domain={["dataMin", "dataMax"]}
                  stroke="var(--color-muted-foreground)"
                  fontSize={10}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelFormatter={(v) => new Date(v).toLocaleString()}
                  formatter={(v: number) => [formatCurrency(v, stock.currency), "Price"]}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={up ? "var(--color-bull)" : "var(--color-bear)"}
                  strokeWidth={2}
                  fill="url(#detail-grad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 h-16">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <XAxis dataKey="time" hide />
                <YAxis hide />
                <Bar
                  dataKey="volume"
                  fill="var(--color-muted-foreground)"
                  opacity={0.3}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 text-sm font-semibold">Key Statistics</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Stat label="Open" value={formatCurrency(stock.open, stock.currency)} />
            <Stat label="Prev Close" value={formatCurrency(stock.previousClose, stock.currency)} />
            <Stat label="Day High" value={formatCurrency(stock.dayHigh, stock.currency)} />
            <Stat label="Day Low" value={formatCurrency(stock.dayLow, stock.currency)} />
            <Stat label="52W High" value={formatCurrency(stock.weekHigh52, stock.currency)} />
            <Stat label="52W Low" value={formatCurrency(stock.weekLow52, stock.currency)} />
            <Stat label="Volume" value={formatNumber(stock.volume)} />
            <Stat label="Avg Volume" value={formatNumber(stock.avgVolume)} />
            <Stat label="Market Cap" value={formatCurrency(stock.marketCap, stock.currency, 0)} />
            <Stat label="P/E Ratio" value={stock.peRatio ? stock.peRatio.toFixed(2) : "—"} />
            <Stat label="EPS" value={stock.eps.toFixed(2)} />
            <Stat label="Div Yield" value={`${stock.dividendYield.toFixed(2)}%`} />
            <Stat label="Dividend" value={formatCurrency(stock.dividend, stock.currency)} />
            <Stat label="Beta" value={stock.beta.toFixed(2)} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-xl border bg-card p-4">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="pt-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <InfoRow
                icon={<Building2 className="h-4 w-4" />}
                label="Headquarters"
                value={stock.exchange === "NSE" ? "Mumbai, India" : "USA"}
              />
              <InfoRow label="CEO" value={stock.ceo ?? "—"} />
              <InfoRow
                icon={<Users className="h-4 w-4" />}
                label="Employees"
                value={stock.employees ? formatNumber(stock.employees) : "—"}
              />
              <InfoRow
                icon={<ExternalLink className="h-4 w-4" />}
                label="Website"
                value={
                  stock.website ? (
                    <a
                      href={`https://${stock.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {stock.website}
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
            </div>
          </TabsContent>

          <TabsContent value="financials" className="pt-4">
            <FinancialsTable stock={stock} />
          </TabsContent>

          <TabsContent value="news" className="pt-4">
            <p className="text-sm text-muted-foreground">
              Related news feed will appear here. See all news on the{" "}
              <Link to="/news" className="text-primary hover:underline">
                News
              </Link>{" "}
              page.
            </p>
          </TabsContent>

          <TabsContent value="analysis" className="pt-4">
            <QuickAnalysis symbol={stock.symbol} />
          </TabsContent>

          <TabsContent value="about" className="pt-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {stock.description ?? "No company description available."}
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-1.5 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular font-medium text-foreground">{value}</span>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b py-2 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function FinancialsTable({ stock }: { stock: import("@/types").Stock }) {
  const rows = useMemo(
    () => [
      { m: "Revenue (TTM)", v: formatCurrency(stock.marketCap * 0.22, stock.currency, 0) },
      { m: "Net Income (TTM)", v: formatCurrency(stock.marketCap * 0.04, stock.currency, 0) },
      { m: "Gross Margin", v: "48.2%" },
      { m: "Operating Margin", v: "26.4%" },
      { m: "Debt / Equity", v: "0.68" },
      { m: "Return on Equity", v: "31.7%" },
      { m: "Free Cash Flow", v: formatCurrency(stock.marketCap * 0.05, stock.currency, 0) },
      { m: "Book Value / Share", v: formatCurrency(stock.price * 0.42, stock.currency) },
    ],
    [stock],
  );
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {rows.map((r) => (
        <div
          key={r.m}
          className="flex items-center justify-between rounded-md border bg-surface px-3 py-2 text-sm"
        >
          <span className="text-muted-foreground">{r.m}</span>
          <span className="tabular font-medium">{r.v}</span>
        </div>
      ))}
    </div>
  );
}

function QuickAnalysis({ symbol }: { symbol: string }) {
  const { data } = useQuery({ queryKey: ["ai", symbol], queryFn: () => aiService.analyze(symbol) });
  if (!data) return <div className="text-sm text-muted-foreground">Generating analysis…</div>;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-md px-2 py-1 text-xs font-semibold uppercase",
            data.recommendation.includes("Buy")
              ? "bg-bull-muted text-bull"
              : data.recommendation.includes("Sell")
                ? "bg-bear-muted text-bear"
                : "bg-muted text-muted-foreground",
          )}
        >
          {data.recommendation}
        </span>
        <span className="text-xs text-muted-foreground">
          Target: <span className="tabular font-semibold text-foreground">${data.targetPrice}</span>
        </span>
        <span className="text-xs text-muted-foreground">
          Confidence:{" "}
          <span className="tabular font-semibold text-foreground">{data.confidenceScore}%</span>
        </span>
        <span className="text-xs text-muted-foreground">
          Risk: <span className="tabular font-semibold text-foreground">{data.riskScore}/100</span>
        </span>
      </div>
      <p className="text-sm text-foreground">{data.summary}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-md border p-3">
          <div className="mb-1 text-xs font-semibold uppercase text-bull">Pros</div>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {data.pros.map((p) => (
              <li key={p}>• {p}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-md border p-3">
          <div className="mb-1 text-xs font-semibold uppercase text-bear">Cons</div>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {data.cons.map((p) => (
              <li key={p}>• {p}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
