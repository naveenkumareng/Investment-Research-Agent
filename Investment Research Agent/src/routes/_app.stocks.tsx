import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { stocksService } from "@/services/stocks-service";
import { ChangeBadge } from "@/components/common/change-badge";
import { formatCurrency, formatNumber } from "@/utils/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/stocks")({
  component: StocksList,
  head: () => ({
    meta: [
      { title: "Stocks — Investa" },
      {
        name: "description",
        content:
          "Browse and search across thousands of stocks by ticker, name, sector, or industry.",
      },
    ],
  }),
});

function StocksList() {
  const matchRoute = useMatchRoute();
  const isExact = matchRoute({ to: "/stocks" });

  if (!isExact) {
    return <Outlet />;
  }

  const [query, setQuery] = useState("");
  const [sector, setSector] = useState<string>("all");
  const [sort, setSort] = useState<"symbol" | "price" | "change" | "marketCap" | "volume">(
    "marketCap",
  );

  const { data: all = [] } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => stocksService.list(),
  });

  const sectors = useMemo(() => Array.from(new Set(all.map((s) => s.sector))), [all]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = all;
    if (q) {
      out = out.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.sector.toLowerCase().includes(q) ||
          s.industry.toLowerCase().includes(q),
      );
    }
    if (sector !== "all") out = out.filter((s) => s.sector === sector);
    return [...out].sort((a, b) => {
      switch (sort) {
        case "symbol":
          return a.symbol.localeCompare(b.symbol);
        case "price":
          return b.price - a.price;
        case "change":
          return b.changePercent - a.changePercent;
        case "volume":
          return b.volume - a.volume;
        default:
          return b.marketCap - a.marketCap;
      }
    });
  }, [all, query, sector, sort]);

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4 lg:p-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Discover</p>
        <h1 className="text-2xl font-semibold">Stocks</h1>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search by ticker, company, sector, industry…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <select
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          className="rounded-md border bg-surface px-3 py-2 text-sm outline-none"
        >
          <option value="all">All sectors</option>
          {sectors.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="rounded-md border bg-surface px-3 py-2 text-sm outline-none"
        >
          <option value="marketCap">Market Cap</option>
          <option value="price">Price</option>
          <option value="change">% Change</option>
          <option value="volume">Volume</option>
          <option value="symbol">Symbol</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium">Symbol</th>
              <th className="hidden px-3 py-2.5 text-left font-medium md:table-cell">Sector</th>
              <th className="px-3 py-2.5 text-right font-medium">Price</th>
              <th className="px-3 py-2.5 text-right font-medium">Change</th>
              <th className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">Volume</th>
              <th className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">
                Market Cap
              </th>
              <th className="hidden px-3 py-2.5 text-right font-medium lg:table-cell">P/E</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.symbol} className="border-t transition-colors hover:bg-surface-elevated">
                <td className="px-3 py-2.5">
                  <Link
                    to="/stocks/$symbol"
                    params={{ symbol: s.symbol }}
                    className="flex flex-col hover:text-primary"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">{s.symbol}</span>
                      <span className="rounded bg-muted px-1 py-0.5 text-[10px] uppercase text-muted-foreground">
                        {s.exchange}
                      </span>
                    </div>
                    <span className="truncate text-xs text-muted-foreground">{s.name}</span>
                  </Link>
                </td>
                <td className="hidden px-3 py-2.5 text-xs text-muted-foreground md:table-cell">
                  {s.sector}
                </td>
                <td className="tabular px-3 py-2.5 text-right font-semibold">
                  {formatCurrency(s.price, s.currency)}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <ChangeBadge value={s.changePercent} percent />
                </td>
                <td
                  className={cn(
                    "tabular hidden px-3 py-2.5 text-right sm:table-cell",
                    "text-muted-foreground",
                  )}
                >
                  {formatNumber(s.volume)}
                </td>
                <td className="tabular hidden px-3 py-2.5 text-right text-muted-foreground sm:table-cell">
                  {formatCurrency(s.marketCap, s.currency, 0)}
                </td>
                <td className="tabular hidden px-3 py-2.5 text-right text-muted-foreground lg:table-cell">
                  {s.peRatio ? s.peRatio.toFixed(1) : "—"}
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-sm text-muted-foreground">
                  No stocks match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
