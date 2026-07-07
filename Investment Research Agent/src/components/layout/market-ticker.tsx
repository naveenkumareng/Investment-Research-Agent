import { useQuery } from "@tanstack/react-query";
import { stocksService } from "@/services/stocks-service";
import { cn } from "@/lib/utils";

export function MarketTicker() {
  const { data: indices = [] } = useQuery({
    queryKey: ["indices"],
    queryFn: () => stocksService.indices(),
  });
  if (!indices.length) return null;
  const items = [...indices, ...indices];
  return (
    <div className="overflow-hidden border-b bg-surface">
      <div className="ticker-scroll flex gap-8 whitespace-nowrap px-4 py-1.5">
        {items.map((idx, i) => (
          <div key={`${idx.symbol}-${i}`} className="flex items-center gap-2 text-xs">
            <span className="font-mono font-semibold text-foreground">{idx.name}</span>
            <span className="tabular text-muted-foreground">
              {idx.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
            <span
              className={cn(
                "tabular font-medium",
                idx.changePercent >= 0 ? "text-bull" : "text-bear",
              )}
            >
              {idx.changePercent >= 0 ? "▲" : "▼"} {Math.abs(idx.changePercent).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
