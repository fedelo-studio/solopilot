import { startOfMonth, isSameMonth, parseISO } from "date-fns";
import {
  Wallet,
  TrendingUp,
  Receipt,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Money } from "@/components/shared/money";
import { KpiSnapshot } from "@/components/shared/kpi-snapshot";
import { AlertCard } from "@/components/shared/alert-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { RecomputeAlertsButton } from "@/components/shared/recompute-alerts-button";
import { CashflowChart } from "@/components/cashflow/cashflow-chart";
import { DealStageBadge, InvoiceStatusBadge } from "@/components/shared/status-badge";

import { redirect } from "next/navigation";
import {
  getAccounts,
  getAlerts,
  getClients,
  getCompanySettings,
  getDeals,
  getExpenses,
  getInvoices,
  isOnboarded,
} from "@/lib/data";
import { currentCash, projectCashflow, buildDailySeries, snapshotAt } from "@/lib/finance/cashflow";
import { totalOwed, liveStatus, isOpen as isInvoiceOpen } from "@/lib/finance/invoices";
import { totalWeighted, isOpen as isDealOpen } from "@/lib/finance/deals";

export default async function DashboardPage() {
  // First-time users land on the welcome wizard instead.
  const settings = await getCompanySettings();
  if (!isOnboarded(settings)) {
    redirect("/bienvenue");
  }

  const today = new Date();
  const [accounts, alerts, clients, deals, expenses, invoices] = await Promise.all([
    getAccounts(),
    getAlerts(),
    getClients(),
    getDeals(),
    getExpenses(),
    getInvoices(),
  ]);

  const cash = currentCash(accounts);
  const openInvoiceTotal = totalOwed(invoices);
  const openDeals = deals.filter(isDealOpen);
  const weighted = totalWeighted(openDeals);

  // Monthly expenses (current month)
  const monthlySpend = expenses
    .filter((e) => isSameMonth(parseISO(e.date), startOfMonth(today)))
    .reduce((acc, e) => acc + e.amount, 0);

  // Cashflow projection
  const entries = projectCashflow({ invoices, deals, expenses });
  const series = buildDailySeries(entries, cash, 90);
  const at30 = snapshotAt(series, 30);
  const at60 = snapshotAt(series, 60);
  const at90 = snapshotAt(series, 90);

  // Recent open deals (highest weighted first)
  const topDeals = [...openDeals]
    .sort(
      (a, b) =>
        b.estimatedAmount * (b.probability / 100) -
        a.estimatedAmount * (a.probability / 100),
    )
    .slice(0, 4);

  const clientById = new Map(clients.map((c) => [c.id, c]));

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <span className="live-dot" />
            Vue d&apos;ensemble · live
          </span>
        }
        title={`Bonjour ${settings.ownerName.split(" ")[0]}.`}
        description="Voilà où en est ton activité aujourd'hui. Tout est exprimé en CHF."
      />

      {/* Top metrics — 4 cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 [&>*]:enter-fade">
        <MetricCard
          label="Cash disponible"
          value={cash}
          icon={Wallet}
          hint="Comptes courants + réserve"
          tone="confirmed"
        />
        <MetricCard
          label="Pipeline pondéré"
          value={weighted}
          icon={TrendingUp}
          hint={`${openDeals.length} deals ouverts`}
          tone="probable"
        />
        <MetricCard
          label="Factures à encaisser"
          value={openInvoiceTotal}
          icon={Receipt}
          hint={`${invoices.filter(isInvoiceOpen).length} en attente`}
          tone="probable"
        />
        <MetricCard
          label="Dépenses ce mois"
          value={monthlySpend}
          icon={CreditCard}
          hint="Toutes catégories"
          tone="neutral"
        />
      </div>

      {/* Cashflow + alerts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Projection de trésorerie — 90 jours</CardTitle>
              <CardDescription>
                Confirmé · probable · hypothétique cumulés à partir du cash actuel.
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href="/cashflow">
                Détails <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pb-4 pl-2 pr-3">
            <CashflowChart series={series} height={240} compact />
            <Separator className="my-4" />
            <div className="grid grid-cols-3 gap-3 px-3 text-sm">
              <KpiSnapshot label="Dans 30 jours" value={at30?.confirmed ?? cash} tier="confirmed" />
              <KpiSnapshot label="Dans 60 jours" value={at60?.probable ?? cash} tier="probable" />
              <KpiSnapshot label="Dans 90 jours" value={at90?.all ?? cash} tier="hypothetical" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Alertes</CardTitle>
              <CardDescription>
                {alerts.length === 0
                  ? "Tout est calme aujourd'hui."
                  : `${alerts.length} signal${alerts.length > 1 ? "s" : ""} à traiter.`}
              </CardDescription>
            </div>
            <RecomputeAlertsButton />
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.length === 0 ? (
              <EmptyState
                size="sm"
                title="Aucune alerte"
                description="Les retards de factures et dépenses non catégorisées apparaîtront ici."
              />
            ) : (
              alerts.map((a) => <AlertCard key={a.id} alert={a} />)
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pipeline highlight + recent invoices */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Deals à plus fort impact</CardTitle>
              <CardDescription>Triés par valeur pondérée.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href="/pipeline">
                Pipeline <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {topDeals.length === 0 ? (
              <EmptyState
                size="sm"
                title="Aucun deal ouvert"
                description="Tes opportunités les plus pondérées s'afficheront ici."
              />
            ) : (
              topDeals.map((deal) => {
                const client = deal.clientId ? clientById.get(deal.clientId) : undefined;
                return (
                  <div
                    key={deal.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{deal.title}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{client?.name ?? "Prospect direct"}</span>
                        <DealStageBadge stage={deal.stage} />
                      </div>
                    </div>
                    <div className="text-right">
                      <Money
                        amount={deal.estimatedAmount * (deal.probability / 100)}
                        className="text-sm font-medium"
                      />
                      <div className="text-meta-num">
                        {deal.estimatedAmount.toLocaleString("de-CH")} × {deal.probability}%
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Factures à surveiller</CardTitle>
              <CardDescription>Envoyées et en retard.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href="/factures">
                Voir tout <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {invoices.filter(isInvoiceOpen).length === 0 ? (
              <EmptyState
                size="sm"
                title="Aucune facture ouverte"
                description="Toutes tes factures sont à jour."
              />
            ) : (
              invoices
                .filter(isInvoiceOpen)
                .slice(0, 5)
                .map((inv) => {
                  const client = clientById.get(inv.clientId);
                  return (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/factures/${inv.id}`}
                            className="text-sm font-medium hover:underline"
                          >
                            #{inv.number}
                          </Link>
                          <InvoiceStatusBadge status={liveStatus(inv)} />
                        </div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {client?.name} · échéance{" "}
                          {new Date(inv.dueDate).toLocaleDateString("fr-CH")}
                        </div>
                      </div>
                      <Money amount={inv.total} className="text-sm font-medium" />
                    </div>
                  );
                })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
