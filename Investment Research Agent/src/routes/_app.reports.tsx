import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { portfolioService } from "@/services/portfolio-service";
import { formatCurrency } from "@/utils/format";
import { StatCard } from "@/components/common/stat-card";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
  head: () => ({
    meta: [
      { title: "Reports — Investa" },
      {
        name: "description",
        content: "Generate portfolio, performance, profit, and tax reports. Export as PDF or CSV.",
      },
    ],
  }),
});

const REPORTS = [
  {
    id: "portfolio",
    title: "Portfolio Report",
    desc: "Snapshot of all holdings, current value, and allocation.",
  },
  {
    id: "performance",
    title: "Performance Report",
    desc: "Total, YTD, and per-position performance breakdown.",
  },
  {
    id: "profit",
    title: "Profit Report",
    desc: "Realized and unrealized P&L with detailed lot tracking.",
  },
  { id: "tax", title: "Tax Report", desc: "Short-term and long-term capital gains for filing." },
];

function ReportsPage() {
  const { data: holdings = [] } = useQuery({
    queryKey: ["portfolio"],
    queryFn: () => portfolioService.holdings(),
  });
  const invested = holdings.reduce((a, h) => a + h.invested, 0);
  const value = holdings.reduce((a, h) => a + h.currentValue, 0);
  const realized = 2450; // mock
  const unrealized = value - invested;

  const download = (format: "pdf" | "csv", reportTitle: string) => {
    toast.success(`${reportTitle} exported as ${format.toUpperCase()}`);
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 p-4 lg:p-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Research</p>
        <h1 className="text-2xl font-semibold">Reports</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Invested" value={formatCurrency(invested, "USD", 0)} />
        <StatCard label="Current Value" value={formatCurrency(value, "USD", 0)} />
        <StatCard label="Realized P&L" value={formatCurrency(realized, "USD", 0)} accent="bull" />
        <StatCard
          label="Unrealized P&L"
          value={formatCurrency(unrealized, "USD", 0)}
          accent={unrealized >= 0 ? "bull" : "bear"}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {REPORTS.map((r) => (
          <div key={r.id} className="rounded-xl border bg-card p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/15 p-2.5 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{r.title}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{r.desc}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => download("pdf", r.title)}
                    className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-surface-elevated"
                  >
                    <Download className="h-3 w-3" /> PDF
                  </button>
                  <button
                    onClick={() => download("csv", r.title)}
                    className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-surface-elevated"
                  >
                    <Download className="h-3 w-3" /> CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
