import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Bell, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { alertsService } from "@/services/alerts-service";
import { stocksService } from "@/services/stocks-service";
import { EmptyState } from "@/components/common/empty-state";
import { formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { Alert } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/alerts")({
  component: AlertsPage,
  head: () => ({
    meta: [
      { title: "Alerts — Investa" },
      {
        name: "description",
        content: "Create price, volume, moving average, RSI, and EMA alerts across your portfolio.",
      },
    ],
  }),
});

function AlertsPage() {
  const qc = useQueryClient();
  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => alertsService.list(),
  });

  const remove = async (id: string) => {
    await alertsService.remove(id);
    qc.invalidateQueries({ queryKey: ["alerts"] });
    toast.success("Alert removed");
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 p-4 lg:p-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Personal</p>
          <h1 className="text-2xl font-semibold">Alerts</h1>
        </div>
        <NewAlertDialog onCreated={() => qc.invalidateQueries({ queryKey: ["alerts"] })} />
      </div>

      {alerts.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-6 w-6" />}
          title="No alerts yet"
          description="Get notified on price moves, volume spikes, RSI signals and more."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {alerts.map((a) => (
            <div key={a.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold">{a.symbol}</span>
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                        a.active ? "bg-bull-muted text-bull" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {a.triggered ? "Triggered" : a.active ? "Active" : "Paused"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <span className="uppercase text-foreground">{a.type}</span> {a.condition}{" "}
                    <span className="tabular font-semibold text-foreground">
                      {a.value.toLocaleString()}
                    </span>
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Created {formatDate(a.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => remove(a.id)}
                  className="rounded p-1.5 text-muted-foreground hover:bg-bear-muted hover:text-bear"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NewAlertDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const { data: stocks = [] } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => stocksService.list(),
  });
  const [symbol, setSymbol] = useState("");
  const [type, setType] = useState<Alert["type"]>("price");
  const [condition, setCondition] = useState<Alert["condition"]>("above");
  const [value, setValue] = useState<number>(0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol) return toast.error("Select a symbol");
    await alertsService.add({ symbol, type, condition, value });
    toast.success("Alert created");
    onCreated();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="h-3.5 w-3.5" /> New Alert
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Alert</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full rounded-md border bg-surface px-3 py-2 text-sm"
            required
          >
            <option value="">Select symbol…</option>
            {stocks.map((s) => (
              <option key={s.symbol} value={s.symbol}>
                {s.symbol} — {s.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Alert["type"])}
              className="rounded-md border bg-surface px-3 py-2 text-sm"
            >
              <option value="price">Price</option>
              <option value="volume">Volume</option>
              <option value="ma">Moving Average</option>
              <option value="rsi">RSI</option>
              <option value="ema">EMA</option>
            </select>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as Alert["condition"])}
              className="rounded-md border bg-surface px-3 py-2 text-sm"
            >
              <option value="above">Above</option>
              <option value="below">Below</option>
              <option value="crosses">Crosses</option>
            </select>
          </div>
          <input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            placeholder="Trigger value"
            className="w-full rounded-md border bg-surface px-3 py-2 text-sm"
            required
          />
          <button
            type="submit"
            className="w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground"
          >
            Create Alert
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
