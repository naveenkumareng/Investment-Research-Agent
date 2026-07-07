import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  className?: string;
  accent?: "default" | "bull" | "bear" | "primary";
}
export function StatCard({ label, value, hint, icon, className, accent = "default" }: Props) {
  const accents = {
    default: "",
    bull: "border-bull/30",
    bear: "border-bear/30",
    primary: "border-primary/40",
  } as const;
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 transition-colors hover:bg-surface-elevated",
        accents[accent],
        className,
      )}
    >
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        {icon}
      </div>
      <div className="mt-2 tabular text-2xl font-semibold text-foreground">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
