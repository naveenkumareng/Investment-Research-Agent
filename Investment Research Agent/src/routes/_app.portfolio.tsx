import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { portfolioService } from "@/services/portfolio-service";
import { stocksService } from "@/services/stocks-service";
import { StatCard } from "@/components/common/stat-card";
import { ChangeBadge } from "@/components/common/change-badge";
import { EmptyState } from "@/components/common/empty-state";
import { formatCurrency, formatDate, formatPercent } from "@/utils/format";
import { useCurrency } from "@/context/currency-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/portfolio")({
  component: PortfolioPage,
  head: () => ({
    meta: [
      { title: "Portfolio — Investa" },
      {
        name: "description",
        content: "Track your holdings, P&L, ROI, and asset allocation across brokers.",
      },
    ],
  }),
});

const colors = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function PortfolioPage() {
  const { currency } = useCurrency();
  const qc = useQueryClient();
  const { data: holdings = [] } = useQuery({
    queryKey: ["portfolio"],
    queryFn: () => portfolioService.holdings(),
  });
  const { data: stocks = [] } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => stocksService.list(),
  });

  const totals = useMemo(() => {
    const invested = holdings.reduce((a, h) => a + h.invested, 0);
    const value = holdings.reduce((a, h) => a + h.currentValue, 0);
    const pnl = value - invested;
    const pnlPercent = invested ? (pnl / invested) * 100 : 0;
    return { invested, value, pnl, pnlPercent };
  }, [holdings]);

  const allocation = holdings.map((h) => ({ name: h.symbol, value: h.currentValue }));

  const removeHolding = async (id: string) => {
    await portfolioService.remove(id);
    qc.invalidateQueries({ queryKey: ["portfolio"] });
    toast.success("Holding removed");
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4 lg:p-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Personal</p>
          <h1 className="text-2xl font-semibold">Portfolio</h1>
        </div>
        <AddHoldingDialog
          stocks={stocks}
          onAdded={() => qc.invalidateQueries({ queryKey: ["portfolio"] })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Invested"
          value={formatCurrency(totals.invested, currency, 0)}
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard label="Current Value" value={formatCurrency(totals.value, currency, 0)} />
        <StatCard
          label="Total P&L"
          value={formatCurrency(totals.pnl, currency, 0)}
          accent={totals.pnl >= 0 ? "bull" : "bear"}
          hint={<ChangeBadge value={totals.pnlPercent} percent />}
        />
        <StatCard
          label="ROI"
          value={formatPercent(totals.pnlPercent)}
          accent={totals.pnl >= 0 ? "bull" : "bear"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 lg:col-span-2">
          <div className="mb-3 text-sm font-semibold">Holdings</div>
          {holdings.length === 0 ? (
            <EmptyState
              title="No holdings yet"
              description="Add your first investment to see analytics."
            />
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Symbol</th>
                    <th className="px-3 py-2 text-right font-medium">Qty</th>
                    <th className="hidden px-3 py-2 text-right font-medium md:table-cell">Avg</th>
                    <th className="px-3 py-2 text-right font-medium">LTP</th>
                    <th className="px-3 py-2 text-right font-medium">P&L</th>
                    <th className="hidden px-3 py-2 text-right font-medium sm:table-cell">ROI</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => (
                    <tr key={h.id} className="border-t hover:bg-surface-elevated">
                      <td className="px-3 py-2">
                        <Link
                          to="/stocks/$symbol"
                          params={{ symbol: h.symbol }}
                          className="hover:text-primary"
                        >
                          <div className="font-mono font-semibold">{h.symbol}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {h.broker} · {formatDate(h.purchaseDate)}
                          </div>
                        </Link>
                      </td>
                      <td className="tabular px-3 py-2 text-right">{h.quantity}</td>
                      <td className="tabular hidden px-3 py-2 text-right text-muted-foreground md:table-cell">
                        {formatCurrency(h.avgPrice, currency)}
                      </td>
                      <td className="tabular px-3 py-2 text-right">
                        {formatCurrency(h.currentPrice, currency)}
                      </td>
                      <td
                        className={cn(
                          "tabular px-3 py-2 text-right",
                          h.pnl >= 0 ? "text-bull" : "text-bear",
                        )}
                      >
                        {formatCurrency(h.pnl, currency, 0)}
                      </td>
                      <td className="hidden px-3 py-2 text-right sm:table-cell">
                        <ChangeBadge value={h.pnlPercent} percent />
                      </td>
                      <td className="px-2 text-right">
                        <button
                          onClick={() => removeHolding(h.id)}
                          className="rounded p-1.5 text-muted-foreground hover:bg-bear-muted hover:text-bear"
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

        <div className="rounded-xl border bg-card p-4">
          <div className="mb-2 text-sm font-semibold">Allocation</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocation}
                  dataKey="value"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  isAnimationActive={false}
                >
                  {allocation.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
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
          <div className="mt-2 space-y-1.5 text-xs">
            {allocation.map((a, i) => (
              <div key={a.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: colors[i % colors.length] }}
                  />
                  <span className="font-mono">{a.name}</span>
                </div>
                <span className="tabular text-muted-foreground">
                  {((a.value / (totals.value || 1)) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AddHoldingDialog({
  stocks,
  onAdded,
}: {
  stocks: import("@/types").Stock[];
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [qty, setQty] = useState<number>(10);
  const [price, setPrice] = useState<number>(100);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [broker, setBroker] = useState<string>("Zerodha");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const stock = stocks.find((s) => s.symbol === symbol.toUpperCase());
    if (!stock) return toast.error("Select a valid symbol");
    setLoading(true);
    try {
      await portfolioService.add({
        symbol: stock.symbol,
        name: stock.name,
        quantity: qty,
        avgPrice: price,
        purchaseDate: date,
        broker,
        currentPrice: stock.price,
      });
      toast.success(`${stock.symbol} added`);
      onAdded();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-3.5 w-3.5" /> Add Investment
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Investment</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="text-xs text-muted-foreground">Symbol</span>
            <select
              value={symbol}
              onChange={(e) => {
                setSymbol(e.target.value);
                const s = stocks.find((x) => x.symbol === e.target.value);
                if (s) setPrice(s.price);
              }}
              className="mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm"
              required
            >
              <option value="">Select a stock…</option>
              {stocks.map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol} — {s.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-muted-foreground">Quantity</span>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Purchase Price</span>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Purchase Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Broker</span>
              <select
                value={broker}
                onChange={(e) => setBroker(e.target.value)}
                className="mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm"
              >
                <option>Zerodha</option>
                <option>Groww</option>
                <option>Upstox</option>
                <option>Robinhood</option>
                <option>Fidelity</option>
                <option>Interactive Brokers</option>
              </select>
            </label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {loading ? "Adding…" : "Add Investment"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
