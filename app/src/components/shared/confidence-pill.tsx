import { Badge } from "@/components/ui/badge";
import type { Confidence } from "@/types/domain";

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
    <Badge variant={tier} className="lowercase">
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABELS[tier]}
    </Badge>
  );
}
