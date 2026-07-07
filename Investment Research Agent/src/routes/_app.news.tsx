import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Bookmark } from "lucide-react";
import { newsService } from "@/services/news-service";
import { timeAgo } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { NewsArticle } from "@/types";

export const Route = createFileRoute("/_app/news")({
  component: NewsPage,
  head: () => ({
    meta: [
      { title: "News — Investa" },
      {
        name: "description",
        content:
          "Market-moving news across business, technology, economy, crypto, India, and global.",
      },
    ],
  }),
});

const CATEGORIES: Array<{ label: string; value: NewsArticle["category"] | "all" }> = [
  { label: "All", value: "all" },
  { label: "Business", value: "business" },
  { label: "Technology", value: "technology" },
  { label: "Economy", value: "economy" },
  { label: "Finance", value: "finance" },
  { label: "Crypto", value: "crypto" },
  { label: "India", value: "india" },
  { label: "Global", value: "global" },
];

function NewsPage() {
  const [category, setCategory] = useState<NewsArticle["category"] | "all">("all");
  const [query, setQuery] = useState("");
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  const { data: news = [] } = useQuery({
    queryKey: ["news", category, query],
    queryFn: () => newsService.list(category, query),
  });

  const toggleBookmark = (id: string) =>
    setBookmarks((b) => (b.includes(id) ? b.filter((x) => x !== id) : [...b, id]));

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4 lg:p-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Research</p>
        <h1 className="text-2xl font-semibold">Market News</h1>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search news…"
            className="w-full rounded-md border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              category === c.value
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:bg-surface-elevated",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {news.map((n) => (
          <article
            key={n.id}
            className="group flex flex-col rounded-xl border bg-card p-4 transition-all hover:border-primary/40"
          >
            <div className="mb-2 flex items-center justify-between text-[10px] uppercase text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-muted px-1.5 py-0.5 font-semibold">{n.source}</span>
                <span>{n.category}</span>
              </div>
              <button
                onClick={() => toggleBookmark(n.id)}
                className={cn(
                  "rounded p-1 hover:bg-muted",
                  bookmarks.includes(n.id) && "text-primary",
                )}
                aria-label="Bookmark"
              >
                <Bookmark
                  className={cn("h-3.5 w-3.5", bookmarks.includes(n.id) && "fill-current")}
                />
              </button>
            </div>
            <h3 className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
              {n.title}
            </h3>
            <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{n.summary}</p>
            <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{timeAgo(n.publishedAt)}</span>
              <div className="flex items-center gap-1">
                {n.symbols?.slice(0, 3).map((s) => (
                  <Link
                    key={s}
                    to="/stocks/$symbol"
                    params={{ symbol: s }}
                    className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] text-primary hover:bg-primary/25"
                  >
                    {s}
                  </Link>
                ))}
                {n.sentiment && (
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[10px] uppercase",
                      n.sentiment === "positive" && "bg-bull-muted text-bull",
                      n.sentiment === "negative" && "bg-bear-muted text-bear",
                      n.sentiment === "neutral" && "bg-muted text-muted-foreground",
                    )}
                  >
                    {n.sentiment}
                  </span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
