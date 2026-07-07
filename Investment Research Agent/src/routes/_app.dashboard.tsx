import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Activity as ActivityIcon,
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart as PieIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { StatCard } from "@/components/common/stat-card";
import { ChangeBadge } from "@/components/common/change-badge";
import { StockCard } from "@/components/common/stock-card";
import { EmptyState } from "@/components/common/empty-state";
import { portfolioService } from "@/services/portfolio-service";
import { stocksService } from "@/services/stocks-service";
import { watchlistService } from "@/services/watchlist-service";
import { newsService } from "@/services/news-service";
import { formatCurrency, formatNumber, formatPercent, timeAgo } from "@/utils/format";
import { useCurrency } from "@/context/currency-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard — Investa" },
      {
        name: "description",
        content: "Portfolio value, market overview, top movers and AI insights at a glance.",
      },
    ],
  }),
});

const chartColors = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function Dashboard() {
  const { currency, currencySymbol } = useCurrency();
  const { data: holdings = [] } = useQuery({
    queryKey: ["portfolio"],
    queryFn: () => portfolioService.holdings(),
  });
  const { data: activity = [] } = useQuery({
    queryKey: ["activity"],
    queryFn: () => portfolioService.activity(),
  });
  const { data: watchlist = [] } = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => watchlistService.list(),
  });
  const { data: gainers = [] } = useQuery({
    queryKey: ["gainers"],
    queryFn: () => stocksService.topGainers(),
  });
  const { data: losers = [] } = useQuery({
    queryKey: ["losers"],
    queryFn: () => stocksService.topLosers(),
  });
  const { data: trending = [] } = useQuery({
    queryKey: ["trending"],
    queryFn: () => stocksService.trending(),
  });
  const { data: news = [] } = useQuery({ queryKey: ["news"], queryFn: () => newsService.list() });
  const { data: chart = [] } = useQuery({
    queryKey: ["dash-chart"],
    queryFn: () => stocksService.chart("SPX-like", "1M"),
    // Use AAPL curve as portfolio proxy
  });

  const totals = useMemo(() => {
    const invested = holdings.reduce((a, h) => a + h.invested, 0);
    const value = holdings.reduce((a, h) => a + h.currentValue, 0);
    const pnl = value - invested;
    const pnlPercent = invested ? (pnl / invested) * 100 : 0;
    const todayGain = holdings.reduce((a, h) => a + h.currentValue * 0.006, 0);
    return { invested, value, pnl, pnlPercent, todayGain };
  }, [holdings]);

  const allocation = useMemo(() => {
    const bySector: Record<string, number> = {};
    holdings.forEach((h) => {
      // Use symbol as proxy grouping for now
      bySector[h.symbol] = (bySector[h.symbol] ?? 0) + h.currentValue;
    });
    return Object.entries(bySector)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [holdings]);

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Overview</p>
          <h1 className="text-2xl font-semibold">Market Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex h-2 w-2 animate-pulse rounded-full bg-bull" />
          Markets open · Live snapshot
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Portfolio Value"
          value={formatCurrency(totals.value, currency, 0)}
          icon={<Wallet className="h-4 w-4" />}
          hint={<ChangeBadge value={totals.pnlPercent} percent />}
        />
        <StatCard
          label="Today's Gain"
          value={formatCurrency(totals.todayGain, currency, 0)}
          icon={<TrendingUp className="h-4 w-4 text-bull" />}
          hint={<span className="text-bull">+0.60% today</span>}
          accent="bull"
        />
        <StatCard
          label="Total P&L"
          value={formatCurrency(totals.pnl, currency, 0)}
          icon={
            totals.pnl >= 0 ? (
              <TrendingUp className="h-4 w-4 text-bull" />
            ) : (
              <TrendingDown className="h-4 w-4 text-bear" />
            )
          }
          hint={
            <span className={totals.pnl >= 0 ? "text-bull" : "text-bear"}>
              {formatPercent(totals.pnlPercent)}
            </span>
          }
          accent={totals.pnl >= 0 ? "bull" : "bear"}
        />
        <StatCard
          label="Holdings"
          value={holdings.length}
          icon={<PieIcon className="h-4 w-4" />}
          hint={`${allocation.length} unique positions`}
        />
      </div>

      {/* Chart + Allocation */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Portfolio Performance</div>
              <div className="text-xs text-muted-foreground">Last 30 days</div>
            </div>
            <ChangeBadge value={totals.pnlPercent} percent size="md" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="portfolio-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelFormatter={(v) => new Date(v).toLocaleString()}
                  formatter={(v: number) => [`${currencySymbol}${v.toFixed(2)}`, "Price"]}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#portfolio-grad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Asset Allocation</div>
              <div className="text-xs text-muted-foreground">By position</div>
            </div>
          </div>
          {allocation.length ? (
            <>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocation}
                      dataKey="value"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      isAnimationActive={false}
                    >
                      {allocation.map((_, i) => (
                        <Cell key={i} fill={chartColors[i % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-popover)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v: number, n) => [formatCurrency(v, currency, 0), n]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1.5">
                {allocation.slice(0, 5).map((a, i) => (
                  <div key={a.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: chartColors[i % chartColors.length] }}
                      />
                      <span className="font-mono">{a.name}</span>
                    </div>
                    <span className="tabular text-muted-foreground">
                      {((a.value / totals.value) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState title="No holdings yet" description="Add positions to see allocation." />
          )}
        </div>
      </div>

      {/* Movers row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <MoverPanel title="Top Gainers" tone="bull" items={gainers} />
        <MoverPanel title="Top Losers" tone="bear" items={losers} />
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Trending</div>
              <div className="text-xs text-muted-foreground">Highest volume today</div>
            </div>
            <Link to="/stocks" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {trending.slice(0, 5).map((s) => (
              <StockCard key={s.symbol} stock={s} />
            ))}
          </div>
        </div>
      </div>

      {/* Watchlist + Activity + News */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Watchlist</div>
              <div className="text-xs text-muted-foreground">Symbols you're tracking</div>
            </div>
            <Link to="/watchlist" className="text-xs text-primary hover:underline">
              Manage
            </Link>
          </div>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Symbol</th>
                  <th className="px-3 py-2 text-right font-medium">Price</th>
                  <th className="px-3 py-2 text-right font-medium">Change</th>
                  <th className="px-3 py-2 text-right font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.slice(0, 6).map((w) => (
                  <tr key={w.id} className="border-t hover:bg-surface-elevated">
                    <td className="px-3 py-2">
                      <Link
                        to="/stocks/$symbol"
                        params={{ symbol: w.symbol }}
                        className="flex items-center gap-2 hover:text-primary"
                      >
                        <span className="font-mono font-semibold">{w.symbol}</span>
                        <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                          {w.name}
                        </span>
                      </Link>
                    </td>
                    <td className="tabular px-3 py-2 text-right">{formatNumber(w.price)}</td>
                    <td
                      className={cn(
                        "tabular px-3 py-2 text-right",
                        w.change >= 0 ? "text-bull" : "text-bear",
                      )}
                    >
                      {w.change >= 0 ? "+" : ""}
                      {w.change.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <ChangeBadge value={w.changePercent} percent showArrow={false} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 text-sm font-semibold">Recent Activity</div>
          <ul className="space-y-3">
            {activity.map((a) => (
              <li key={a.id} className="flex items-start gap-2 text-sm">
                <div
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                    a.type === "buy" && "bg-bull-muted text-bull",
                    a.type === "sell" && "bg-bear-muted text-bear",
                    a.type === "alert" && "bg-warning/20 text-warning",
                    a.type === "watch" && "bg-primary/20 text-primary",
                    a.type === "dividend" && "bg-chart-3/20 text-chart-3",
                  )}
                >
                  <ActivityIcon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-semibold">{a.symbol}</span>
                    <span className="text-[10px] uppercase text-muted-foreground">{a.type}</span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{a.description}</p>
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {timeAgo(a.timestamp)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* News + AI hint */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold">Latest News</div>
            <Link to="/news" className="text-xs text-primary hover:underline">
              All news
            </Link>
          </div>
          <div className="space-y-3">
            {news.slice(0, 4).map((n) => (
              <a
                key={n.id}
                href={n.url}
                className="group block rounded-lg border p-3 hover:border-primary/40 hover:bg-surface-elevated"
              >
                <div className="mb-1 flex items-center gap-2 text-[10px] uppercase text-muted-foreground">
                  <span className="rounded bg-muted px-1.5 py-0.5">{n.source}</span>
                  <span>{timeAgo(n.publishedAt)}</span>
                  {n.symbols?.map((s) => (
                    <span
                      key={s}
                      className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-primary"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <h4 className="text-sm font-semibold text-foreground group-hover:text-primary">
                  {n.title}
                </h4>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.summary}</p>
              </a>
            ))}
          </div>
        </div>

        <Link
          to="/ai"
          className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/15 via-card to-card p-5 transition-all hover:border-primary/50"
        >
          <div className="grid-lines absolute inset-0 opacity-30" />
          <div className="relative">
            <span className="inline-block rounded bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
              AI Research
            </span>
            <h3 className="mt-3 text-lg font-semibold">Ask anything about a stock</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Fundamental & technical analysis, pros/cons, risk score, and 12-month outlook in
              seconds.
            </p>
            <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
              Try Investa AI{" "}
              <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

function MoverPanel({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "bull" | "bear";
  items: Array<import("@/types").Stock>;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">Session leaders</div>
        </div>
        {tone === "bull" ? (
          <TrendingUp className="h-4 w-4 text-bull" />
        ) : (
          <TrendingDown className="h-4 w-4 text-bear" />
        )}
      </div>
      <div className="space-y-2">
        {items.slice(0, 5).map((s) => (
          <StockCard key={s.symbol} stock={s} />
        ))}
      </div>
    </div>
  );
}
