import type { Deal, DealStage } from "@/types/domain";
import { DEAL_STAGES } from "@/types/domain";

/** Weighted value = estimated amount × probability (0–100).
 *  Won deals count at 100% regardless of stored probability; lost at 0%. */
export function weightedValue(deal: Deal): number {
  if (deal.stage === "won") return deal.estimatedAmount;
  if (deal.stage === "lost") return 0;
  return deal.estimatedAmount * (deal.probability / 100);
}

/** Sum of weighted values across an arbitrary list of deals. */
export function totalWeighted(deals: Deal[]): number {
  return deals.reduce((acc, d) => acc + weightedValue(d), 0);
}

/** Group deals by stage, preserving the canonical stage ordering. */
export function groupByStage(deals: Deal[]): Record<DealStage, Deal[]> {
  const initial = Object.fromEntries(DEAL_STAGES.map((s) => [s, [] as Deal[]])) as Record<
    DealStage,
    Deal[]
  >;
  for (const deal of deals) {
    initial[deal.stage].push(deal);
  }
  return initial;
}

/** Deals that count as "open" for the pipeline — excludes won and lost. */
export function isOpen(deal: Deal): boolean {
  return deal.stage !== "won" && deal.stage !== "lost";
}

/** Default probability per stage when a user creates a new deal.
 *  These are sane defaults; the user can override per deal. */
export const DEFAULT_PROBABILITY: Record<DealStage, number> = {
  lead: 10,
  qualified: 25,
  proposal: 50,
  negotiation: 75,
  won: 100,
  lost: 0,
};
