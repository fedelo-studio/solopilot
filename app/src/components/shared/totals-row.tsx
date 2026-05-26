import { cn } from "@/lib/utils";
import { Money } from "@/components/shared/money";

interface TotalsRowProps {
  label: string;
  value: number;
  /** Render the row as the grand-total line (foreground colour + medium weight). */
  bold?: boolean;
  className?: string;
}

/** A single label/amount pair as used in the totals stack of invoice and
 *  quote editors (`Sous-total / TVA / Total TTC`). Centralises the
 *  `flex justify-between + Money` pattern that was duplicated four times. */
export function TotalsRow({ label, value, bold, className }: TotalsRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between",
        bold ? "font-medium text-foreground" : "text-muted-foreground",
        className,
      )}
    >
      <span>{label}</span>
      <Money amount={value} />
    </div>
  );
}
