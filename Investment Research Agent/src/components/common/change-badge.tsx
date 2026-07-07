import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";
import { formatPercent, formatSigned } from "@/utils/format";

interface Props {
  value: number;
  percent?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  showArrow?: boolean;
}
export function ChangeBadge({ value, percent, className, size = "sm", showArrow = true }: Props) {
  const up = value >= 0;
  const sizes = {
    sm: "text-xs px-1.5 py-0.5 gap-0.5",
    md: "text-sm px-2 py-1 gap-1",
    lg: "text-base px-2.5 py-1 gap-1",
  } as const;
  return (
    <span
      className={cn(
        "tabular inline-flex items-center rounded-md font-medium",
        up ? "bg-bull-muted text-bull" : "bg-bear-muted text-bear",
        sizes[size],
        className,
      )}
    >
      {showArrow && (up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      {percent ? formatPercent(value) : formatSigned(value)}
    </span>
  );
}
