import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/finance/format";
import type { Currency } from "@/types/domain";

interface MoneyProps {
  amount: number;
  currency?: Currency;
  compact?: boolean;
  /** Show + sign on positive amounts (useful for cash deltas). */
  signed?: boolean;
  /** Color positive green and negative red automatically. */
  tone?: "neutral" | "auto";
  className?: string;
}

/** Canonical way to render a monetary amount across the app.
 *  Always tabular, always with the same locale rules.
 */
export function Money({
  amount,
  currency = "CHF",
  compact = false,
  signed = false,
  tone = "neutral",
  className,
}: MoneyProps) {
  const formatted = formatMoney(Math.abs(amount), currency, { compact });
  const sign = amount < 0 ? "−" : signed && amount > 0 ? "+" : "";

  const toneClass =
    tone === "auto"
      ? amount > 0
        ? "text-confirmed"
        : amount < 0
          ? "text-danger"
          : "text-foreground"
      : undefined;

  return (
    <span className={cn("money", toneClass, className)}>
      {sign}
      {formatted}
    </span>
  );
}
