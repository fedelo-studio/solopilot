"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { formatAmount } from "@/lib/finance/format";
import type { MonthlyRevenuePoint } from "@/lib/finance/reports";

export function RevenueChart({ data }: { data: MonthlyRevenuePoint[] }) {
  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} opacity={0.5} />
          <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis
            tickFormatter={(v) => formatAmount(Number(v), { compact: true })}
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={70}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;
              const point = payload[0].payload as MonthlyRevenuePoint;
              return (
                <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
                  <div className="mb-1 font-medium capitalize">{label}</div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(var(--confirmed))" }} />
                      Encaissé
                    </span>
                    <span className="money">{formatAmount(point.paid)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(var(--probable))" }} />
                      À encaisser
                    </span>
                    <span className="money">{formatAmount(point.outstanding)}</span>
                  </div>
                </div>
              );
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            formatter={(value) => <span className="text-muted-foreground">{value}</span>}
          />
          <Bar dataKey="paid" name="Encaissé" stackId="rev" fill="hsl(var(--confirmed))" radius={[0, 0, 0, 0]} />
          <Bar dataKey="outstanding" name="À encaisser" stackId="rev" fill="hsl(var(--probable))" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
