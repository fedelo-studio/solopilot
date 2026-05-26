import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Money } from "./money";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

type Tone = "neutral" | "confirmed" | "probable" | "hypothetical" | "warning" | "danger";

interface MetricCardProps {
  label: string;
  /** Numeric value — rendered as money if `asMoney`, otherwise as a locale-formatted number. */
  value: number;
  currency?: string;
  /** Optional secondary line below the value. */
  hint?: string;
  /** A small icon at the top-right to anchor the card. */
  icon?: LucideIcon;
  /** Percentage change vs previous period; positive = green by convention. */
  delta?: number;
  deltaLabel?: string;
  /** Tone applied to the value — drives color, not background. */
  tone?: Tone;
  className?: string;
  asMoney?: boolean;
}

const TONE_CLASS: Record<Tone, string> = {
  neutral: "text-foreground",
  confirmed: "text-confirmed",
  probable: "text-probable",
  hypothetical: "text-hypothetical",
  warning: "text-warning",
  danger: "text-danger",
};

/* MetricCard — the canonical at-a-glance KPI tile for SoloPilot.
 * Tone colors the numeric value; the hot top-stripe is decorative only
 * (motion-reduced users get a static treatment). */
export function MetricCard({
  label,
  value,
  currency = "CHF",
  hint,
  icon: Icon,
  delta,
  deltaLabel,
  tone = "neutral",
  className,
  asMoney = true,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-shadow hover:shadow-md",
        className,
      )}
    >
      {/* Hot top-stripe — Fedelo accent moment. Decorative only; reduced-motion
          users see a static no-op (scale-x-0 stays). */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-hot transition-transform duration-300 group-hover:scale-x-100 motion-reduce:transition-none"
      />
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="eyebrow">{label}</div>
          {Icon ? (
            <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} aria-hidden />
          ) : null}
        </div>
        <div className="mt-3">
          {asMoney ? (
            <Money
              amount={value}
              currency={currency as never}
              className={cn("text-2xl font-medium tracking-tight", TONE_CLASS[tone])}
            />
          ) : (
            <span className={cn("num text-2xl font-medium tracking-tight", TONE_CLASS[tone])}>
              {new Intl.NumberFormat("fr-CH").format(value)}
            </span>
          )}
        </div>
        {(hint || typeof delta === "number") && (
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="truncate">{hint}</span>
            {typeof delta === "number" && (
              <span
                className={cn(
                  "num inline-flex shrink-0 items-center gap-1",
                  delta > 0 ? "text-confirmed" : delta < 0 ? "text-danger" : "",
                )}
              >
                {delta > 0 ? (
                  <ArrowUpRight className="h-3 w-3" aria-hidden />
                ) : delta < 0 ? (
                  <ArrowDownRight className="h-3 w-3" aria-hidden />
                ) : null}
                {Math.abs(delta).toFixed(0)}%{deltaLabel ? ` ${deltaLabel}` : ""}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
