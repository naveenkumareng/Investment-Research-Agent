import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { stocksService } from "@/services/stocks-service";
import { ChangeBadge } from "@/components/common/change-badge";
import { formatCurrency, formatNumber } from "@/utils/format";

export const Route = createFileRoute("/_app/screener")({
  component: ScreenerPage,
  head: () => ({
    meta: [
      { title: "Screener — Investa" },
      {
        name: "description",
        content:
          "Filter stocks by market cap, sector, price, volume, dividend, P/E, and 52-week range.",
      },
    ],
  }),
});

function ScreenerPage() {
  const { data: stocks = [] } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => stocksService.list(),
  });

  const [sector, setSector] = useState("all");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [minMcap, setMinMcap] = useState<number | "">("");
  const [minVolume, setMinVolume] = useState<number | "">("");
  const [maxPE, setMaxPE] = useState<number | "">("");
  const [minDivYield, setMinDivYield] = useState<number | "">("");
  const [near52High, setNear52High] = useState(false);

  const sectors = useMemo(() => Array.from(new Set(stocks.map((s) => s.sector))), [stocks]);

  const filtered = stocks.filter((s) => {
    if (sector !== "all" && s.sector !== sector) return false;
    if (minPrice !== "" && s.price < minPrice) return false;
    if (maxPrice !== "" && s.price > maxPrice) return false;
    if (minMcap !== "" && s.marketCap < Number(minMcap) * 1e9) return false;
    if (minVolume !== "" && s.volume < Number(minVolume) * 1e6) return false;
    if (maxPE !== "" && s.peRatio > maxPE) return false;
    if (minDivYield !== "" && s.dividendYield < minDivYield) return false;
    if (near52High && s.price < s.weekHigh52 * 0.95) return false;
    return true;
  });

  const reset = () => {
    setSector("all");
    setMinPrice("");
    setMaxPrice("");
    setMinMcap("");
    setMinVolume("");
    setMaxPE("");
    setMinDivYield("");
    setNear52High(false);
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Discover</p>
          <h1 className="text-2xl font-semibold">Market Screener</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
        <aside className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Filter className="h-4 w-4" /> Filters
            </div>
            <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground">
              Reset
            </button>
          </div>
          <div className="space-y-3 text-sm">
            <SelectField label="Sector" value={sector} onChange={setSector}>
              <option value="all">All sectors</option>
              {sectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </SelectField>
            <RangePair
              label="Price"
              a={minPrice}
              b={maxPrice}
              setA={setMinPrice}
              setB={setMaxPrice}
              pa="Min"
              pb="Max"
            />
            <NumField
              label="Market Cap (Billion)"
              value={minMcap}
              setValue={setMinMcap}
              placeholder="Min B"
            />
            <NumField
              label="Volume (Million)"
              value={minVolume}
              setValue={setMinVolume}
              placeholder="Min M"
            />
            <NumField label="Max P/E Ratio" value={maxPE} setValue={setMaxPE} placeholder="≤" />
            <NumField
              label="Min Dividend Yield %"
              value={minDivYield}
              setValue={setMinDivYield}
              placeholder="≥"
            />
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={near52High}
                onChange={(e) => setNear52High(e.target.checked)}
                className="h-3.5 w-3.5 accent-primary"
              />
              Within 5% of 52-week high
            </label>
          </div>
          <div className="mt-4 rounded-md bg-surface p-2 text-center text-xs text-muted-foreground">
            {filtered.length} results
          </div>
        </aside>

        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium">Symbol</th>
                <th className="px-3 py-2.5 text-right font-medium">Price</th>
                <th className="px-3 py-2.5 text-right font-medium">%</th>
                <th className="hidden px-3 py-2.5 text-right font-medium sm:table-cell">M-Cap</th>
                <th className="hidden px-3 py-2.5 text-right font-medium md:table-cell">P/E</th>
                <th className="hidden px-3 py-2.5 text-right font-medium md:table-cell">Div %</th>
                <th className="hidden px-3 py-2.5 text-right font-medium lg:table-cell">Volume</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.symbol} className="border-t hover:bg-surface-elevated">
                  <td className="px-3 py-2.5">
                    <Link
                      to="/stocks/$symbol"
                      params={{ symbol: s.symbol }}
                      className="hover:text-primary"
                    >
                      <span className="font-mono font-semibold">{s.symbol}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{s.name}</span>
                    </Link>
                  </td>
                  <td className="tabular px-3 py-2.5 text-right">
                    {formatCurrency(s.price, s.currency)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <ChangeBadge value={s.changePercent} percent />
                  </td>
                  <td className="tabular hidden px-3 py-2.5 text-right text-muted-foreground sm:table-cell">
                    {formatCurrency(s.marketCap, s.currency, 0)}
                  </td>
                  <td className="tabular hidden px-3 py-2.5 text-right text-muted-foreground md:table-cell">
                    {s.peRatio ? s.peRatio.toFixed(1) : "—"}
                  </td>
                  <td className="tabular hidden px-3 py-2.5 text-right text-muted-foreground md:table-cell">
                    {s.dividendYield.toFixed(2)}%
                  </td>
                  <td className="tabular hidden px-3 py-2.5 text-right text-muted-foreground lg:table-cell">
                    {formatNumber(s.volume)}
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-sm text-muted-foreground">
                    No matches. Try widening your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border bg-surface px-2 py-1.5 text-sm outline-none"
      >
        {children}
      </select>
    </label>
  );
}
function NumField({
  label,
  value,
  setValue,
  placeholder,
}: {
  label: string;
  value: number | "";
  setValue: (v: number | "") => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value === "" ? "" : Number(e.target.value))}
        placeholder={placeholder}
        className="w-full rounded-md border bg-surface px-2 py-1.5 text-sm outline-none"
      />
    </label>
  );
}
function RangePair({
  label,
  a,
  b,
  setA,
  setB,
  pa,
  pb,
}: {
  label: string;
  a: number | "";
  b: number | "";
  setA: (v: number | "") => void;
  setB: (v: number | "") => void;
  pa: string;
  pb: string;
}) {
  return (
    <div>
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          placeholder={pa}
          value={a}
          onChange={(e) => setA(e.target.value === "" ? "" : Number(e.target.value))}
          className="rounded-md border bg-surface px-2 py-1.5 text-sm outline-none"
        />
        <input
          type="number"
          placeholder={pb}
          value={b}
          onChange={(e) => setB(e.target.value === "" ? "" : Number(e.target.value))}
          className="rounded-md border bg-surface px-2 py-1.5 text-sm outline-none"
        />
      </div>
    </div>
  );
}
