import Link from "next/link";
import { cn } from "@/lib/utils";
import { Money } from "@/components/shared/money";
import { formatRelativeDate } from "@/lib/finance/format";
import type { Client, Deal } from "@/types/domain";
import { weightedValue } from "@/lib/finance/deals";
import { DealRowActions } from "./deal-row-actions";
import { DealStageMenu } from "./deal-stage-menu";

interface DealCardProps {
  deal: Deal;
  client?: Client;
  className?: string;
}

export function DealCard({ deal, client, className }: DealCardProps) {
  const weighted = weightedValue(deal);
  return (
    <article
      className={cn(
        "group rounded-md border border-border bg-card p-3 shadow-card transition-all hover:border-foreground/20 hover:shadow-md focus-within:shadow-focus",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/pipeline/${deal.id}`}
          className="line-clamp-2 rounded-sm text-sm font-medium leading-tight outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        >
          {deal.title}
        </Link>
        <DealRowActions dealId={deal.id} title={deal.title} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {client?.name ?? <span className="italic">Prospect direct</span>}
      </p>

      {/* Inline stage menu — one click to qualify / propose / negotiate / close. */}
      <div className="mt-2 flex items-center gap-2">
        <DealStageMenu dealId={deal.id} stage={deal.stage} size="sm" />
        <span className="num text-meta font-medium uppercase tracking-wider text-muted-foreground">
          {deal.probability}%
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div className="leading-tight">
          <div className="eyebrow">Pondéré</div>
          <Money amount={weighted} className="text-sm font-medium" />
        </div>
        <div className="text-right leading-tight">
          <div className="eyebrow">Estimé</div>
          <span className="num text-xs text-muted-foreground">
            {deal.estimatedAmount.toLocaleString("de-CH")}
          </span>
        </div>
      </div>

      {deal.expectedSignatureDate ? (
        <div className="mt-2 border-t border-border pt-2 text-meta text-muted-foreground">
          Signature {formatRelativeDate(deal.expectedSignatureDate)}
        </div>
      ) : null}
    </article>
  );
}
