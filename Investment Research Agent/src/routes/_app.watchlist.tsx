import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Star, Trash2, Search, Plus } from "lucide-react";
import { toast } from "sonner";
import { watchlistService } from "@/services/watchlist-service";
import { stocksService } from "@/services/stocks-service";
import { ChangeBadge } from "@/components/common/change-badge";
import { EmptyState } from "@/components/common/empty-state";
import { formatCurrency, formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/watchlist")({
  component: WatchlistPage,
  head: () => ({
    meta: [
      { title: "Watchlist — Investa" },
      {
        name: "description",
        content: "Your saved symbols with live prices, sorting, filtering, and one-click access.",
      },
    ],
  }),
});

function WatchlistPage() {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"added" | "change" | "price" | "symbol">("added");
  const [adding, setAdding] = useState(false);
  const [newSymbol, setNewSymbol] = useState("");

  const { data: items = [] } = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => watchlistService.list(),
  });
  const { data: stocks = [] } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => stocksService.list(),
  });

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    let out = items;
    if (q)
      out = out.filter(
        (i) => i.symbol.toLowerCase().includes(q) || i.name.toLowerCase().includes(q),
      );
    return [...out].sort((a, b) => {
      if (sort === "change") return b.changePercent - a.changePercent;
      if (sort === "price") return b.price - a.price;
      if (sort === "symbol") return a.symbol.localeCompare(b.symbol);
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    });
  }, [items, query, sort]);

  const suggestions = useMemo(
    () =>
      stocks.filter((s) => s.symbol.toLowerCase().includes(newSymbol.toLowerCase())).slice(0, 6),
    [stocks, newSymbol],
  );

  const remove = async (symbol: string) => {
    await watchlistService.remove(symbol);
    qc.invalidateQueries({ queryKey: ["watchlist"] });
    toast.success(`Removed ${symbol}`);
  };
  const add = async (symbol: string) => {
    try {
      await watchlistService.add(symbol);
      qc.invalidateQueries({ queryKey: ["watchlist"] });
      toast.success(`Added ${symbol}`);
      setNewSymbol("");
      setAdding(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4 lg:p-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Personal</p>
          <h1 className="text-2xl font-semibold">Watchlist</h1>
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" /> Add Symbol
        </button>
      </div>

      {adding && (
        <div className="rounded-xl border bg-card p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              placeholder="Type ticker or company name…"
              className="w-full rounded-md border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((s) => (
              <button
                key={s.symbol}
                onClick={() => add(s.symbol)}
                className="flex items-center justify-between rounded-md border p-2 text-left text-sm hover:border-primary/40"
              >
                <span>
                  <span className="font-mono font-semibold">{s.symbol}</span>{" "}
                  <span className="text-xs text-muted-foreground">{s.name}</span>
                </span>
                <Plus className="h-3.5 w-3.5 text-primary" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter watchlist…"
            className="w-full rounded-md border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="rounded-md border bg-surface px-3 py-2 text-sm outline-none"
        >
          <option value="added">Recently added</option>
          <option value="change">Top movers</option>
          <option value="price">Price</option>
          <option value="symbol">Symbol A-Z</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Star className="h-6 w-6" />}
          title="No symbols in your watchlist"
          description="Add stocks to track their live price and changes here."
          action={
            <button
              onClick={() => setAdding(true)}
              className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
            >
              Add your first symbol
            </button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium">Symbol</th>
                <th className="px-3 py-2.5 text-right font-medium">Price</th>
                <th className="px-3 py-2.5 text-right font-medium">Change</th>
                <th className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">Added</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((w) => (
                <tr key={w.id} className="border-t hover:bg-surface-elevated">
                  <td className="px-3 py-2.5">
                    <Link
                      to="/stocks/$symbol"
                      params={{ symbol: w.symbol }}
                      className="hover:text-primary"
                    >
                      <div className="font-mono font-semibold">{w.symbol}</div>
                      <div className="truncate text-xs text-muted-foreground">{w.name}</div>
                    </Link>
                  </td>
                  <td className="tabular px-3 py-2.5 text-right font-semibold">
                    {formatCurrency(w.price, "USD")}
                  </td>
                  <td
                    className={cn(
                      "tabular px-3 py-2.5 text-right",
                      w.change >= 0 ? "text-bull" : "text-bear",
                    )}
                  >
                    <div>
                      {w.change >= 0 ? "+" : ""}
                      {w.change.toFixed(2)}
                    </div>
                    <ChangeBadge value={w.changePercent} percent showArrow={false} />
                  </td>
                  <td className="hidden px-3 py-2.5 text-right text-xs text-muted-foreground sm:table-cell">
                    {formatDate(w.addedAt)}
                  </td>
                  <td className="px-2 text-right">
                    <button
                      onClick={() => remove(w.symbol)}
                      className="rounded p-1.5 text-muted-foreground hover:bg-bear-muted hover:text-bear"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
