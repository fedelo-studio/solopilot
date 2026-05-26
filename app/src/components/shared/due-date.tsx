import { cn } from "@/lib/utils";
import { formatDate, daysUntil } from "@/lib/finance/format";

/* Render a date plus a calm, accurate "x days left / x days late" annotation.
 * Single source of truth for the pattern used across factures, devis, projets.
 *
 * Tone rules:
 *   overdue    → negative days  → danger (or warning, see `severity` prop)
 *   today      → 0 days         → warning
 *   future     → positive days  → muted
 *   completed  → suppressed annotation (status === "paid" / "accepted" etc.)
 */
interface DueDateProps {
  date: string;
  /** When true the annotation is suppressed (terminal state — paid, accepted, cancelled). */
  resolved?: boolean;
  /** When `overdue` should appear as warning rather than danger (e.g. expired quote). */
  severity?: "danger" | "warning";
  className?: string;
}

export function DueDate({ date, resolved = false, severity = "danger", className }: DueDateProps) {
  const days = daysUntil(date);
  const isOverdue = !resolved && days < 0;
  const isToday = !resolved && days === 0;

  const annotation = resolved
    ? null
    : days < 0
      ? `${Math.abs(days)} j de retard`
      : days === 0
        ? "aujourd'hui"
        : `dans ${days} j`;

  return (
    <div className={cn("min-w-0", className)}>
      <div>{formatDate(date)}</div>
      {annotation ? (
        <div
          className={cn(
            "text-meta",
            isOverdue ? (severity === "warning" ? "text-warning" : "text-danger") : isToday ? "text-warning" : "text-muted-foreground",
          )}
        >
          {annotation}
        </div>
      ) : null}
    </div>
  );
}

/* For quotes — same shape, French wording around validity rather than payment.
 * Inline so callers don't have to think about which variant to use. */
interface ValidityDateProps {
  date: string;
  resolved?: boolean;
  className?: string;
}

export function ValidityDate({ date, resolved = false, className }: ValidityDateProps) {
  const days = daysUntil(date);
  const annotation = resolved
    ? null
    : days < 0
      ? `expiré il y a ${Math.abs(days)} j`
      : days === 0
        ? "expire aujourd'hui"
        : `${days} j restants`;

  return (
    <div className={cn("min-w-0", className)}>
      <div>{formatDate(date)}</div>
      {annotation ? (
        <div
          className={cn(
            "text-meta",
            !resolved && days < 0 ? "text-warning" : "text-muted-foreground",
          )}
        >
          {annotation}
        </div>
      ) : null}
    </div>
  );
}
