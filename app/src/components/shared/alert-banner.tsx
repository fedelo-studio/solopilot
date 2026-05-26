import { cn } from "@/lib/utils";
import { AlertTriangle, Info, AlertOctagon } from "lucide-react";
import type { Alert as DomainAlert } from "@/types/domain";
import { formatRelativeDate } from "@/lib/finance/format";

/* Editorial alert — Linear / Stripe inspired.
 * Background stays card-white; severity is conveyed by a thin left rail,
 * a small color dot and the icon tint. No pastel washes. */
const SEVERITY_STYLES = {
  info: {
    container: "border-probable-line",
    rail: "bg-probable",
    icon: "text-probable",
    Icon: Info,
  },
  warning: {
    container: "border-warning-line",
    rail: "bg-warning",
    icon: "text-warning",
    Icon: AlertTriangle,
  },
  danger: {
    container: "border-danger-line",
    rail: "bg-danger",
    icon: "text-danger",
    Icon: AlertOctagon,
  },
} as const;

export function AlertCard({ alert, className }: { alert: DomainAlert; className?: string }) {
  const { container, rail, icon, Icon } = SEVERITY_STYLES[alert.severity];
  return (
    <div
      className={cn(
        "relative flex items-start gap-3 overflow-hidden rounded-lg border bg-card px-4 py-3 transition-colors",
        container,
        className,
      )}
    >
      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-[2px]", rail)} />
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", icon)} strokeWidth={1.5} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <p className="text-sm font-medium leading-tight text-foreground">{alert.title}</p>
          <span className="text-xs text-muted-foreground">
            {formatRelativeDate(alert.createdAt)}
          </span>
        </div>
        {alert.body ? <p className="mt-1 text-xs text-muted-foreground">{alert.body}</p> : null}
      </div>
    </div>
  );
}
