import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { Stock } from "@/types";
import { ChangeBadge } from "./change-badge";
import { formatCurrency } from "@/utils/format";

export function StockCard({ stock, className }: { stock: Stock; className?: string }) {
  const up = stock.changePercent >= 0;
  return (
    <Link
      to="/stocks/$symbol"
      params={{ symbol: stock.symbol }}
      className={cn(
        "group flex items-center justify-between rounded-lg border bg-card p-3 transition-all hover:border-primary/40 hover:bg-surface-elevated",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold">{stock.symbol}</span>
          <span className="rounded bg-muted px-1 py-0.5 text-[10px] uppercase text-muted-foreground">
            {stock.exchange}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{stock.name}</p>
      </div>
      <div className="text-right">
        <div className={cn("tabular text-sm font-semibold", up ? "text-bull" : "text-bear")}>
          {formatCurrency(stock.price, stock.currency)}
        </div>
        <ChangeBadge value={stock.changePercent} percent className="mt-0.5" />
      </div>
    </Link>
  );
}
