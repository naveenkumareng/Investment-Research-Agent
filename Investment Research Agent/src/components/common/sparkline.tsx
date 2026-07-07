import { Area, AreaChart, ResponsiveContainer } from "recharts";
import type { PricePoint } from "@/types";

interface Props {
  data: PricePoint[];
  positive?: boolean;
  height?: number;
}
export function Sparkline({ data, positive = true, height = 40 }: Props) {
  const stroke = positive ? "var(--color-bull)" : "var(--color-bear)";
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${positive ? "up" : "down"}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="price"
          stroke={stroke}
          strokeWidth={1.5}
          fill={`url(#spark-${positive ? "up" : "down"})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
