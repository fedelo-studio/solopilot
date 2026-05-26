"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Money } from "@/components/shared/money";
import { ConfidencePill } from "@/components/shared/confidence-pill";
import { MetricCard } from "@/components/shared/metric-card";

const TIER_LABEL: Record<"confirmed" | "probable" | "hypothetical", string> = {
  confirmed: "Confirmé",
  probable: "Probable",
  hypothetical: "Hypothétique",
};

const TIER_DOT: Record<"confirmed" | "probable" | "hypothetical", string> = {
  confirmed: "bg-confirmed",
  probable: "bg-probable",
  hypothetical: "bg-hypothetical",
};

const TIER_NET_TONE: Record<"confirmed" | "probable" | "hypothetical", string> = {
  confirmed: "text-confirmed",
  probable: "text-probable",
  hypothetical: "text-hypothetical",
};
import { CashflowChart } from "@/components/cashflow/cashflow-chart";
import {
  applyScenario,
  buildDailySeries,
  type CashflowEntry,
  type CashflowScenario,
  SCENARIO_DESCRIPTIONS,
  SCENARIO_LABELS,
  snapshotAt,
  summarizeCashflow,
} from "@/lib/finance/cashflow";
import { formatDate } from "@/lib/finance/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Deal } from "@/types/domain";

interface ScenarioTabsProps {
  entries: CashflowEntry[];
  startingCash: number;
  deals: Deal[];
  horizonDays: number;
}

const SCENARIOS: CashflowScenario[] = ["pessimistic", "realistic", "optimistic"];

export function ScenarioTabs({ entries, startingCash, deals, horizonDays }: ScenarioTabsProps) {
  const [scenario, setScenario] = useState<CashflowScenario>("realistic");

  const scenarioEntries = useMemo(
    () => applyScenario(entries, scenario, deals),
    [entries, deals, scenario],
  );
  const series = useMemo(
    () => buildDailySeries(scenarioEntries, startingCash, horizonDays),
    [scenarioEntries, startingCash, horizonDays],
  );
  const summary = useMemo(
    () => summarizeCashflow(scenarioEntries, startingCash),
    [scenarioEntries, startingCash],
  );

  const at30 = snapshotAt(series, 30);
  const at60 = snapshotAt(series, 60);
  const at90 = snapshotAt(series, 90);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <Tabs value={scenario} onValueChange={(v) => setScenario(v as CashflowScenario)}>
          <TabsList>
            {SCENARIOS.map((s) => (
              <TabsTrigger key={s} value={s}>
                {SCENARIO_LABELS[s]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <p className="max-w-md text-xs text-muted-foreground">
          {SCENARIO_DESCRIPTIONS[scenario]}
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <MetricCard label="Cash aujourd'hui" value={startingCash} tone="confirmed" />
        <MetricCard
          label="Dans 30 j (confirmé)"
          value={at30?.confirmed ?? startingCash}
          tone="confirmed"
        />
        <MetricCard label="Dans 60 j (+ probable)" value={at60?.probable ?? startingCash} tone="probable" />
        <MetricCard label="Dans 90 j (tout)" value={at90?.all ?? startingCash} tone="hypothetical" />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Trajectoire — {SCENARIO_LABELS[scenario].toLowerCase()}</CardTitle>
          <CardDescription>
            Trois trajectoires cumulées : confirmé seul · confirmé + probable · tout.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CashflowChart series={series} height={320} />
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {(["confirmed", "probable", "hypothetical"] as const).map((tier) => {
          const t = summary.byTier[tier];
          return (
            <Card key={tier} className="p-5">
              {/* Eyebrow title — coloured dot + mono label, no stretched pill */}
              <div className="mb-4 flex items-center gap-2">
                <span
                  className={cn("h-1.5 w-1.5 rounded-full", TIER_DOT[tier])}
                  aria-hidden
                />
                <span className="eyebrow">{TIER_LABEL[tier]}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-muted-foreground">Entrées</span>
                  <Money amount={t.inflow} className="text-foreground" />
                </div>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-muted-foreground">Sorties</span>
                  <Money amount={-t.outflow} tone="auto" />
                </div>
                <div className="flex items-baseline justify-between border-t border-border pt-2 text-sm">
                  <span className="font-medium">Net</span>
                  <Money
                    amount={t.net}
                    className={cn("font-medium", TIER_NET_TONE[tier])}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mouvements projetés</CardTitle>
          <CardDescription>
            {scenarioEntries.length} mouvement{scenarioEntries.length > 1 ? "s" : ""} dans le scénario {SCENARIO_LABELS[scenario].toLowerCase()}.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Confiance</TableHead>
                <TableHead className="text-right">Entrée</TableHead>
                <TableHead className="text-right">Sortie</TableHead>
                <TableHead className="text-right">Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scenarioEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    Aucun mouvement projeté dans ce scénario.
                  </TableCell>
                </TableRow>
              ) : (
                scenarioEntries.map((e, idx) => (
                  <TableRow key={`${e.label}-${idx}`}>
                    <TableCell className="text-muted-foreground">{formatDate(e.date)}</TableCell>
                    <TableCell>{e.label}</TableCell>
                    <TableCell>
                      <ConfidencePill tier={e.confidence} />
                    </TableCell>
                    <TableCell className="text-right">
                      {e.inflow > 0 ? <Money amount={e.inflow} className="text-confirmed" /> : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {e.outflow > 0 ? <Money amount={-e.outflow} tone="auto" /> : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Money amount={e.net} tone="auto" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
