import Link from "next/link";
import { Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

import { PageHeader } from "@/components/shared/page-header";
import { Money } from "@/components/shared/money";
import { EmptyState } from "@/components/shared/empty-state";
import { BudgetRowActions } from "@/components/budgets/budget-row-actions";

import { getBudgets, getExpenseCategories, getExpenses } from "@/lib/data";
import { budgetUsage } from "@/lib/finance/budget";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<
  ReturnType<typeof budgetUsage>["status"],
  { label: string; variant: "default" | "confirmed" | "probable" | "warning" | "danger" }
> = {
  ok: { label: "Confortable", variant: "confirmed" },
  watch: { label: "À surveiller", variant: "probable" },
  near_limit: { label: "Proche de la limite", variant: "warning" },
  exceeded: { label: "Dépassé", variant: "danger" },
};

const INDICATOR_TONE: Record<
  ReturnType<typeof budgetUsage>["status"],
  string
> = {
  ok: "bg-confirmed",
  watch: "bg-probable",
  near_limit: "bg-warning",
  exceeded: "bg-danger",
};

export default async function BudgetsPage() {
  const [budgets, categories, expenses] = await Promise.all([
    getBudgets(),
    getExpenseCategories(),
    getExpenses(),
  ]);
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Finances"
        title="Budgets"
        description="Définis combien tu prévois de dépenser par catégorie chaque mois. Une alerte se déclenche à 80%."
        actions={
          <Button asChild>
            <Link href="/budgets/nouveau">
              <Plus className="h-4 w-4" />
              Nouveau budget
            </Link>
          </Button>
        }
      />

      {budgets.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Aucun budget défini"
          description="Crée ton premier budget mensuel pour piloter tes dépenses par catégorie."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {budgets.map((b) => {
            const cat = categoryById.get(b.categoryId);
            const usage = budgetUsage(b, expenses);
            const badge = STATUS_BADGE[usage.status];
            return (
              <Card key={b.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="flex min-w-0 items-center gap-2 text-base">
                      {cat ? (
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                      ) : null}
                      <span className="truncate">{cat?.name ?? "Catégorie"}</span>
                    </CardTitle>
                    <div className="flex shrink-0 items-center gap-1">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                      <BudgetRowActions budgetId={b.id} categoryName={cat?.name ?? "Catégorie"} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <Money
                      amount={usage.spent}
                      className={cn(
                        "text-xl font-medium",
                        usage.status === "exceeded" && "text-danger",
                      )}
                    />
                    <div className="text-xs text-muted-foreground">
                      / <Money amount={usage.planned} className="text-foreground" />
                    </div>
                  </div>
                  <Progress
                    value={usage.usagePercent}
                    indicatorClassName={INDICATOR_TONE[usage.status]}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="num text-muted-foreground">{usage.usagePercent}%</span>
                    {usage.overBy > 0 ? (
                      <span className="text-danger">
                        Dépassement de <Money amount={usage.overBy} className="text-xs" />
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Reste <Money amount={usage.remaining} className="text-xs" />
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        Note : les budgets ne remplacent pas une comptabilité. Ils servent à piloter le rythme
        de tes dépenses par catégorie. Les seuils d'alerte sont configurables.
      </p>
    </div>
  );
}
