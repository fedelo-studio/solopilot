import { ConfidencePill } from "./confidence-pill";
import { Money } from "./money";
import { cn } from "@/lib/utils";
import type { Confidence } from "@/types/domain";

/* Small in-card numeric snapshot — paired with a confidence tier badge.
 * Used inside the cashflow projection card and any "in N days" breakdown. */
interface KpiSnapshotProps {
  label: string;
  value: number;
  tier: Confidence;
  className?: string;
}

export function KpiSnapshot({ label, value, tier, className }: KpiSnapshotProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <ConfidencePill tier={tier} />
      <div className="text-xs text-muted-foreground">{label}</div>
      <Money amount={value} className="text-base font-medium" />
    </div>
  );
}
