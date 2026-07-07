import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Command, Moon, Search, Sun, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { stocksService } from "@/services/stocks-service";
import { useTheme } from "@/context/theme-context";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format";

export function Topbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { data: stocks = [] } = useQuery({
    queryKey: ["stocks", "list"],
    queryFn: () => stocksService.list(),
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
        <Link to="/dashboard" className="flex items-center gap-2 lg:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <TrendingUp className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold">Investa</span>
        </Link>

        <button
          onClick={() => setOpen(true)}
          className="flex flex-1 items-center gap-2 rounded-md border bg-surface px-3 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-surface-elevated md:max-w-md"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 truncate">Search symbols, companies, sectors…</span>
          <kbd className="hidden items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-flex">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={toggle}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link
            to="/alerts"
            className="relative rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Alerts"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-bear" />
          </Link>
        </div>
      </header>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search ticker, company, sector…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Stocks">
            {stocks.slice(0, 12).map((s) => (
              <CommandItem
                key={s.symbol}
                value={`${s.symbol} ${s.name} ${s.sector}`}
                onSelect={() => {
                  setOpen(false);
                  navigate({ to: "/stocks/$symbol", params: { symbol: s.symbol } });
                }}
              >
                <div className="flex w-full items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold">{s.symbol}</span>
                    <span className="truncate text-sm text-muted-foreground">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tabular text-xs">{formatCurrency(s.price, s.currency)}</span>
                    <span
                      className={cn(
                        "tabular text-xs font-medium",
                        s.changePercent >= 0 ? "text-bull" : "text-bear",
                      )}
                    >
                      {s.changePercent >= 0 ? "+" : ""}
                      {s.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
