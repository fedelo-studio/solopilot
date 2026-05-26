import { cn } from "@/lib/utils";

/* Column headers for the invoice/quote line-items editor.
 * Matches the row grid template `1fr 80px 120px 80px 120px 36px` exactly so
 * the labels line up with the input cells underneath.
 *
 * Hidden on mobile because the row collapses to a vertical stack at <md;
 * on small screens, the inputs' placeholders carry the meaning.
 *
 * Single source of truth — used by both `new-*` and `*-edit-form` flows for
 * factures and devis. */
interface LineItemsHeaderProps {
  className?: string;
}

export function LineItemsHeader({ className }: LineItemsHeaderProps) {
  return (
    <div
      role="row"
      className={cn(
        "hidden gap-3 px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid md:grid-cols-[1fr_80px_120px_80px_120px_36px]",
        className,
      )}
    >
      <span role="columnheader">Description</span>
      <span role="columnheader" className="text-right">
        Qté
      </span>
      <span role="columnheader" className="text-right">
        Prix unit.
      </span>
      <span role="columnheader" className="text-right">
        TVA&nbsp;%
      </span>
      <span role="columnheader" className="text-right">
        Total&nbsp;HT
      </span>
      <span aria-hidden />
    </div>
  );
}
