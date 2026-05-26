import { Badge } from "@/components/ui/badge";
import type { Confidence } from "@/types/domain";

/* Confidence labels. Kept UPPERCASE so the pill renders with the same
 * editorial weight as every other status badge in the system — JetBrains Mono
 * + tracking-wide + lowercase produced unevenly spaced glyphs; uppercase is
 * what the rest of the design language uses and what JBM was tuned for. */
const LABELS: Record<Confidence, string> = {
  confirmed: "Confirmé",
  probable: "Probable",
  hypothetical: "Hypothétique",
};

/** A small pill that classifies an amount by confidence tier — used in cashflow
 *  and in the dashboard to enforce the "confirmed / probable / hypothetical"
 *  product invariant. */
export function ConfidencePill({ tier }: { tier: Confidence }) {
  return (
    <Badge variant={tier}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {LABELS[tier]}
    </Badge>
  );
}
