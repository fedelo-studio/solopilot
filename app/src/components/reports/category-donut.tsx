"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/lib/finance/format";
import type { CategoryBreakdownSlice } from "@/lib/finance/reports";

export function CategoryDonut({ slices }: { slices: CategoryBreakdownSlice[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  if (slices.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Aucune dépense sur la période.
      </p>
    );
  }

  const total = slices.reduce((acc, s) => acc + s.amount, 0);
  const active = activeId ? slices.find((s) => s.categoryId === activeId) : null;

  return (
    <div className="flex flex-col items-center gap-6 md:flex-row md:items-stretch">
      <div style={{ width: 200, height: 200 }} className="relative shrink-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={slices}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={1}
              dataKey="amount"
              nameKey="name"
              strokeWidth={0}
              isAnimationActive={false}
              onMouseLeave={() => setActiveId(null)}
            >
              {slices.map((slice) => {
                const isActive = activeId === slice.categoryId;
                const isDimmed = activeId !== null && !isActive;
                return (
                  <Cell
                    key={slice.categoryId}
                    fill={slice.color}
                    fillOpacity={isDimmed ? 0.35 : 1}
                    style={{ transition: "fill-opacity 200ms var(--ease-out)" }}
                    onMouseEnter={() => setActiveId(slice.categoryId)}
                  />
                );
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center label — swaps between TOTAL and the hovered slice */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          {active ? (
            <>
              <span
                className="eyebrow max-w-full truncate"
                style={{ color: active.color }}
              >
                {active.name}
              </span>
              <span className="money text-base font-medium leading-tight">
                {formatAmount(active.amount, { compact: true })}
              </span>
              <span className="caption mt-0.5">{active.percent.toFixed(1)}%</span>
            </>
          ) : (
            <>
              <span className="eyebrow">Total</span>
              <span className="money text-base font-medium leading-tight">
                {formatAmount(total, { compact: true })}
              </span>
            </>
          )}
        </div>
      </div>

      <ul className="flex-1 space-y-2 text-sm">
        {slices.map((slice) => {
          const isActive = activeId === slice.categoryId;
          const isDimmed = activeId !== null && !isActive;
          return (
            <li
              key={slice.categoryId}
              className={cn(
                "flex items-center justify-between gap-3 rounded-md px-2 py-1 transition-colors",
                isActive && "bg-accent",
                isDimmed && "opacity-40",
              )}
              onMouseEnter={() => setActiveId(slice.categoryId)}
              onMouseLeave={() => setActiveId(null)}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="truncate">{slice.name}</span>
              </span>
              <span className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="num">{slice.percent.toFixed(0)}%</span>
                <span className="money">{formatAmount(slice.amount, { compact: true })}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
