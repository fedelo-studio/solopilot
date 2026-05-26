import { PageHeader } from "@/components/shared/page-header";
import { DealCard } from "@/components/pipeline/deal-card";
import { Money } from "@/components/shared/money";
import { EmptyState } from "@/components/shared/empty-state";
import { NewDealDialog } from "@/components/pipeline/new-deal-dialog";
import { getClients, getDeals } from "@/lib/data";
import { groupByStage, totalWeighted } from "@/lib/finance/deals";
import { DEAL_STAGES, DEAL_STAGE_LABELS, type DealStage } from "@/types/domain";

export default async function PipelinePage() {
  const [clients, deals] = await Promise.all([getClients(), getDeals()]);
  const grouped = groupByStage(deals);
  const clientById = new Map(clients.map((c) => [c.id, c]));

  // We hide "won" and "lost" from the kanban — they get their own collapsed section.
  const activeStages: DealStage[] = DEAL_STAGES.filter((s) => s !== "won" && s !== "lost") as DealStage[];

  const totalOpenWeighted = totalWeighted(
    deals.filter((d) => d.stage !== "won" && d.stage !== "lost"),
  );

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader
        eyebrow="Commercial"
        title="Pipeline"
        description={
          <>
            Visualise tes opportunités par étape. La valeur affichée par colonne est{" "}
            <span className="font-medium text-foreground">pondérée par probabilité</span>.
          </>
        }
        actions={
          <>
            <div className="hidden flex-col items-end leading-tight md:flex">
              <span className="eyebrow">Pipeline pondéré</span>
              <Money amount={totalOpenWeighted} className="text-lg font-medium" />
            </div>
            <NewDealDialog clients={clients} />
          </>
        }
      />

      <div className="grid auto-rows-min grid-flow-col gap-3 overflow-x-auto pb-4 scrollbar-thin md:grid-cols-4">
        {activeStages.map((stage) => {
          const deals = grouped[stage];
          const stageWeighted = totalWeighted(deals);
          return (
            <section
              key={stage}
              className="flex min-w-[260px] flex-col rounded-lg border border-border bg-muted/30 p-3 md:min-w-0"
            >
              <header className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-medium">{DEAL_STAGE_LABELS[stage]}</h2>
                  <p className="text-meta-num">
                    {deals.length} deal{deals.length > 1 ? "s" : ""}
                  </p>
                </div>
                <Money amount={stageWeighted} className="text-xs font-medium" />
              </header>

              <div className="flex flex-1 flex-col gap-2">
                {deals.length === 0 ? (
                  <EmptyState size="sm" title="Aucun deal à cette étape" />
                ) : (
                  deals.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      client={deal.clientId ? clientById.get(deal.clientId) : undefined}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Closed deals — collapsed strip */}
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {(["won", "lost"] as DealStage[]).map((stage) => {
          const deals = grouped[stage];
          return (
            <section
              key={stage}
              className="rounded-lg border border-border bg-muted/20 p-4"
            >
              <header className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium text-muted-foreground">
                  {DEAL_STAGE_LABELS[stage]}
                </h2>
                <span className="num text-xs text-muted-foreground">
                  {deals.length} deal{deals.length > 1 ? "s" : ""}
                </span>
              </header>
              <ul className="space-y-1 text-sm">
                {deals.map((d) => {
                  const c = d.clientId ? clientById.get(d.clientId) : undefined;
                  return (
                    <li
                      key={d.id}
                      className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-card"
                    >
                      <span className="truncate text-foreground/90">
                        {d.title}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {c?.name ?? "Prospect direct"}
                        </span>
                      </span>
                      <Money amount={d.estimatedAmount} className="text-xs" />
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
