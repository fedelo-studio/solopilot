import { Badge } from "@/components/ui/badge";
import type { CapacityBand } from "@/lib/finance/projects";

const CAPACITY_LABELS: Record<CapacityBand, string> = {
  under: "Sous-chargé",
  optimal: "Charge optimale",
  near: "Proche de la capacité",
  over: "Surchargé",
  no_data: "Aucune donnée",
};

const CAPACITY_VARIANT: Record<CapacityBand, "confirmed" | "probable" | "warning" | "danger" | "hypothetical"> = {
  under: "probable",
  optimal: "confirmed",
  near: "warning",
  over: "danger",
  no_data: "hypothetical",
};

/** Workload indicator for a person's current-week capacity — reuses the
 *  existing Badge tones (no new color tokens), same idea as the margin-percent
 *  ternary already used in /rapports. */
export function CapacityPill({ band }: { band: CapacityBand }) {
  return <Badge variant={CAPACITY_VARIANT[band]}>{CAPACITY_LABELS[band]}</Badge>;
}
