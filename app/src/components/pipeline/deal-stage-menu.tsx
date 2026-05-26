"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setDealStage } from "@/app/actions/deals";
import { DEAL_STAGES, DEAL_STAGE_LABELS, type DealStage } from "@/types/domain";

/** Inline stage menu — the cockpit-level shortcut for "qualifier un lead".
 *  Renders the current stage as the trigger (a badge with a chevron), opens
 *  a dropdown with every stage, and commits via `setDealStage`. No form,
 *  no navigation — single click to move the deal across the pipeline.
 *
 *  Placed on every <DealCard> AND on the pipeline detail page so the user
 *  never has to open an edit form just to change a stage. */
interface DealStageMenuProps {
  dealId: string;
  stage: DealStage;
  /** Visual size — sm fits on a kanban card, md on a detail page. */
  size?: "sm" | "md";
  /** Stop propagation when the trigger is clicked (used on cards wrapped by a link). */
  stopPropagation?: boolean;
}

const VARIANT_BY_STAGE: Record<DealStage, Parameters<typeof Badge>[0]["variant"]> = {
  lead: "hypothetical",
  qualified: "hypothetical",
  proposal: "probable",
  negotiation: "probable",
  won: "confirmed",
  lost: "danger",
};

export function DealStageMenu({
  dealId,
  stage,
  size = "sm",
  stopPropagation = false,
}: DealStageMenuProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function move(next: DealStage) {
    if (next === stage) return;
    startTransition(async () => {
      const result = await setDealStage({ id: dealId, stage: next });
      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Changer l'étape du deal — actuellement ${DEAL_STAGE_LABELS[stage]}`}
        onClick={(e) => {
          if (stopPropagation) e.stopPropagation();
        }}
        className="inline-flex items-center gap-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:opacity-50"
        disabled={pending}
      >
        <Badge variant={VARIANT_BY_STAGE[stage]} className={size === "md" ? "text-xs" : undefined}>
          {DEAL_STAGE_LABELS[stage]}
          <ChevronDown className="h-3 w-3 opacity-70" aria-hidden />
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuLabel className="text-xs">Déplacer ce deal vers…</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {DEAL_STAGES.map((s) => (
          <DropdownMenuItem
            key={s}
            disabled={s === stage}
            onSelect={() => move(s)}
            className="justify-between"
          >
            <span>{DEAL_STAGE_LABELS[s]}</span>
            {s === stage ? <span className="text-meta text-muted-foreground">actuel</span> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
