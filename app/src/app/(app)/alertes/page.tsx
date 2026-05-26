import Link from "next/link";
import { Bell } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { AlertCard } from "@/components/shared/alert-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { RecomputeAlertsButton } from "@/components/shared/recompute-alerts-button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import { getAlerts } from "@/lib/data";
import type { Alert } from "@/types/domain";

function groupBySeverity(alerts: Alert[]) {
  return alerts.reduce(
    (acc, a) => {
      acc[a.severity].push(a);
      return acc;
    },
    { danger: [] as Alert[], warning: [] as Alert[], info: [] as Alert[] },
  );
}

export default async function AlertesPage() {
  const alerts = await getAlerts();
  const groups = groupBySeverity(alerts);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Pilotage"
        title="Alertes"
        description="Tous les signaux à traiter : factures en retard, dépenses non catégorisées, budgets dépassés, deals dormants."
        actions={<RecomputeAlertsButton />}
      />

      {alerts.length === 0 ? (
        <EmptyState
          branded
          icon={Bell}
          title="Tout est en ordre."
          description="Aucune alerte à traiter pour le moment. SoloPilot recalcule les signaux automatiquement quand tes données bougent."
        />
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">
              Toutes <Badge variant="default" className="ml-1.5">{alerts.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="danger">
              Critiques <Badge variant="danger" className="ml-1.5">{groups.danger.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="warning">
              Avertissements <Badge variant="warning" className="ml-1.5">{groups.warning.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="info">
              Infos <Badge variant="probable" className="ml-1.5">{groups.info.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-2">
            {alerts.map((a) => (
              <AlertCard key={a.id} alert={a} />
            ))}
          </TabsContent>
          <TabsContent value="danger" className="space-y-2">
            {groups.danger.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucune alerte critique. Tout va bien.
              </p>
            ) : (
              groups.danger.map((a) => <AlertCard key={a.id} alert={a} />)
            )}
          </TabsContent>
          <TabsContent value="warning" className="space-y-2">
            {groups.warning.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucun avertissement.
              </p>
            ) : (
              groups.warning.map((a) => <AlertCard key={a.id} alert={a} />)
            )}
          </TabsContent>
          <TabsContent value="info" className="space-y-2">
            {groups.info.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucune info pour l'instant.
              </p>
            ) : (
              groups.info.map((a) => <AlertCard key={a.id} alert={a} />)
            )}
          </TabsContent>
        </Tabs>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Comment les alertes sont calculées</CardTitle>
          <CardDescription>
            SoloPilot regarde l'état actuel de tes données et applique ces règles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <Rule label="Facture en retard">
            Si la date d'échéance est passée et que la facture n'est pas payée, statut → en
            retard, alerte critique avec le solde dû et le nombre de jours.
          </Rule>
          <Rule label="Dépense non catégorisée">
            Si une dépense n'a pas de catégorie, alerte d'avertissement.
          </Rule>
          <Rule label="Budget &gt; 80%">
            Avertissement quand le mois en cours approche du budget. À 100%+, alerte critique.
          </Rule>
          <Rule label="Deal sans activité &gt; 30j">
            Info de relance pour les deals ouverts depuis longtemps.
          </Rule>
          <Rule label="Trésorerie basse">
            Avertissement sous 5'000 CHF, critique sous 2'500. Seuil configurable.
          </Rule>
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">
        Pour les relances automatiques par email,{" "}
        <Link href="/aide" className="underline underline-offset-2">
          consulte la doc de l'edge function
        </Link>
        .
      </p>
    </div>
  );
}

function Rule({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 border-l-2 border-border pl-3">
      <span className="shrink-0 font-medium text-foreground">{label}</span>
      <span>{children}</span>
    </div>
  );
}
