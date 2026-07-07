import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { aiService } from "@/services/ai-service";
import { cn } from "@/lib/utils";
import type { AIInsight } from "@/types";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/_app/ai")({
  validateSearch: searchSchema,
  component: AIPage,
  head: () => ({
    meta: [
      { title: "AI Research — Investa" },
      {
        name: "description",
        content:
          "Ask questions about any stock and get instant fundamental, technical, and risk analysis.",
      },
    ],
  }),
});

const EXAMPLES = [
  "Should I buy Apple?",
  "Analyze Tesla for me",
  "Is Infosys good for long-term investment?",
  "Compare NVDA fundamentals",
];

function AIPage() {
  const { q } = useSearch({ from: "/_app/ai" });
  const [query, setQuery] = useState(q ?? "");
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<AIInsight | null>(null);

  const run = async (input: string) => {
    setLoading(true);
    setInsight(null);
    try {
      const r = await aiService.analyze(input);
      setInsight(r);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (q) run(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 lg:p-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Research</p>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Sparkles className="h-6 w-6 text-primary" /> AI Research
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask about any stock — get fundamental, technical, risk, and recommendation insights.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) run(query.trim());
        }}
        className="relative"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., Should I buy AAPL? Analyze Tesla…"
          className="w-full rounded-xl border bg-surface py-4 pl-5 pr-14 text-base outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={loading}
          className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((e) => (
          <button
            key={e}
            onClick={() => {
              setQuery(e);
              run(e);
            }}
            className="rounded-full border px-3 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary"
          >
            {e}
          </button>
        ))}
      </div>

      {loading && (
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
          Analyzing markets, fundamentals, and technicals…
        </div>
      )}

      {insight && !loading && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase text-muted-foreground">{insight.companyName}</div>
                <div className="font-mono text-2xl font-bold">{insight.symbol}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-bold uppercase",
                    insight.recommendation.includes("Buy")
                      ? "bg-bull-muted text-bull"
                      : insight.recommendation.includes("Sell")
                        ? "bg-bear-muted text-bear"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {insight.recommendation}
                </div>
                <Metric label="Target" value={`$${insight.targetPrice}`} />
                <Metric label="Confidence" value={`${insight.confidenceScore}%`} />
                <Metric label="Risk" value={`${insight.riskScore}/100`} />
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed">{insight.summary}</p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Section title="Business Overview">{insight.businessOverview}</Section>
            <Section title="Growth Potential">{insight.growthPotential}</Section>
            <Section title="Financial Health">{insight.financialHealth}</Section>
            <Section title="Fundamental Analysis">{insight.fundamentalAnalysis}</Section>
            <Section title="Technical Analysis">{insight.technicalAnalysis}</Section>
            <Section title="Future Outlook">{insight.futureOutlook}</Section>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border bg-card p-4">
              <div className="mb-2 text-xs font-bold uppercase text-bull">Pros</div>
              <ul className="space-y-1 text-sm">
                {insight.pros.map((p) => (
                  <li key={p}>✓ {p}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="mb-2 text-xs font-bold uppercase text-bear">Cons</div>
              <ul className="space-y-1 text-sm">
                {insight.cons.map((p) => (
                  <li key={p}>✕ {p}</li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            AI-generated for informational purposes only. Not investment advice.
          </p>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-primary">{title}</div>
      <p className="text-sm leading-relaxed text-foreground/90">{children}</p>
    </div>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-surface px-3 py-1.5 text-center">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="tabular text-sm font-semibold">{value}</div>
    </div>
  );
}
