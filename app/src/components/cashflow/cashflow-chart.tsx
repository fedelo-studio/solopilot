"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import type { CashflowDayPoint } from "@/lib/finance/cashflow";
import { formatAmount } from "@/lib/finance/format";

interface CashflowChartProps {
  series: CashflowDayPoint[];
  compact?: boolean;
  height?: number;
}

export function CashflowChart({ series, compact = false, height = 280 }: CashflowChartProps) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="fillAll" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--hypothetical))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--hypothetical))" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="fillProbable" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--probable))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--probable))" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="fillConfirmed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--confirmed))" stopOpacity={0.35} />
              <stop offset="95%" stopColor="hsl(var(--confirmed))" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="hsl(var(--border))"
            strokeDasharray="3 3"
            vertical={false}
            opacity={0.5}
          />
          <XAxis
            dataKey="date"
            tickFormatter={(value) =>
              format(parseISO(value), compact ? "dd MMM" : "dd MMM", { locale: fr })
            }
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            minTickGap={compact ? 30 : 24}
          />
          <YAxis
            tickFormatter={(value) => formatAmount(Number(value), { compact: true })}
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={70}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;
              const point = payload[0].payload as CashflowDayPoint;
              return (
                <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
                  <div className="mb-1 font-medium">
                    {format(parseISO(label), "EEEE d MMMM", { locale: fr })}
                  </div>
                  <div className="space-y-0.5">
                    <Row color="hsl(var(--confirmed))" label="Confirmé" value={point.confirmed} />
                    <Row color="hsl(var(--probable))" label="+ Probable" value={point.probable} />
                    <Row color="hsl(var(--hypothetical))" label="+ Hypothétique" value={point.all} />
                  </div>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="all"
            stroke="hsl(var(--hypothetical))"
            strokeWidth={1.2}
            fill="url(#fillAll)"
            strokeDasharray="4 3"
          />
          <Area
            type="monotone"
            dataKey="probable"
            stroke="hsl(var(--probable))"
            strokeWidth={1.5}
            fill="url(#fillProbable)"
            strokeDasharray="2 3"
          />
          <Area
            type="monotone"
            dataKey="confirmed"
            stroke="hsl(var(--confirmed))"
            strokeWidth={2}
            fill="url(#fillConfirmed)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function Row({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="money tabular-nums">{formatAmount(value)}</span>
    </div>
  );
}
