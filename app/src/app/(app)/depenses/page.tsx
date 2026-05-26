import { CreditCard, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { PageHeader } from "@/components/shared/page-header";
import { Money } from "@/components/shared/money";
import { MetricCard } from "@/components/shared/metric-card";
import { EmptyState } from "@/components/shared/empty-state";
import { NewExpenseDialog } from "@/components/expenses/new-expense-dialog";
import { ExpenseRowActions } from "@/components/expenses/expense-row-actions";

import {
  getClients,
  getDeals,
  getExpenseCategories,
  getExpenses,
  getProjects,
} from "@/lib/data";
import { formatDate } from "@/lib/finance/format";
import { startOfMonth, isSameMonth, parseISO } from "date-fns";

export default async function DepensesPage() {
  const [clients, deals, categories, expenses, projects] = await Promise.all([
    getClients(),
    getDeals(),
    getExpenseCategories(),
    getExpenses(),
    getProjects(),
  ]);

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const projectById = new Map(projects.map((p) => [p.id, p]));
  const dealById = new Map(deals.map((d) => [d.id, d]));

  const today = new Date();
  const thisMonth = expenses.filter((e) => isSameMonth(parseISO(e.date), startOfMonth(today)));
  const monthlyTotal = thisMonth.reduce((acc, e) => acc + e.amount, 0);
  const uncategorized = expenses.filter((e) => !e.categoryId);
  const billable = expenses.filter((e) => e.billable);
  const billableTotal = billable.reduce((acc, e) => acc + e.amount, 0);

  const sorted = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Finances"
        title="Dépenses"
        description="Tu peux lier une dépense à un projet, un client, ou même à un prospect avant signature — la marge se mettra à jour automatiquement."
        actions={
          <NewExpenseDialog
            categories={categories}
            clients={clients}
            projects={projects}
            deals={deals}
          />
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <MetricCard label="Ce mois-ci" value={monthlyTotal} tone="neutral" hint={`${thisMonth.length} mouvements`} />
        <MetricCard
          label="Refacturables"
          value={billableTotal}
          tone="probable"
          hint={`${billable.length} dépenses à refacturer`}
        />
        <MetricCard
          label="Non catégorisées"
          value={uncategorized.reduce((acc, e) => acc + e.amount, 0)}
          tone={uncategorized.length > 0 ? "warning" : "neutral"}
          hint={`${uncategorized.length} à classer`}
          icon={AlertCircle}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="Aucune dépense enregistrée"
              description="Ajoute tes premières dépenses pour suivre tes coûts par projet."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Lié à</TableHead>
                  <TableHead>Refacturable</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((e) => {
                  const category = e.categoryId ? categoryById.get(e.categoryId) : null;
                  const linkLabel = (() => {
                    if (e.link.type === "none") return "—";
                    if (e.link.type === "client") return clientById.get(e.link.id)?.name ?? "Client";
                    if (e.link.type === "project") return projectById.get(e.link.id)?.name ?? "Projet";
                    if (e.link.type === "deal") {
                      const d = dealById.get(e.link.id);
                      return d ? `Deal · ${d.title}` : "Deal";
                    }
                    return "—";
                  })();
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="text-muted-foreground">{formatDate(e.date)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{e.vendor}</div>
                        {e.description ? (
                          <div className="text-xs text-muted-foreground">{e.description}</div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {category ? (
                          <span className="inline-flex items-center gap-1.5 text-sm">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </span>
                        ) : (
                          <Badge variant="warning">À catégoriser</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{linkLabel}</TableCell>
                      <TableCell>
                        {e.billable ? (
                          <Badge variant="probable">Refacturable</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Non</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Money amount={e.amount} />
                      </TableCell>
                      <TableCell className="text-right">
                        <ExpenseRowActions expenseId={e.id} vendor={e.vendor} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
