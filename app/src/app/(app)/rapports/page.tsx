import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { RevenueChart } from "@/components/reports/revenue-chart";
import { CategoryDonut } from "@/components/reports/category-donut";

import {
  getClients,
  getExpenseCategories,
  getExpenses,
  getInvoices,
  getProjects,
} from "@/lib/data";
import {
  expensesByCategory,
  monthlyRevenue,
  periodSummary,
  projectMargins,
  topClients,
} from "@/lib/finance/reports";

const MONTHS_BACK = 12;

export default async function RapportsPage() {
  const [clients, invoices, expenses, categories, projects] = await Promise.all([
    getClients(),
    getInvoices(),
    getExpenses(),
    getExpenseCategories(),
    getProjects(),
  ]);

  const summary = periodSummary(invoices, expenses, MONTHS_BACK);
  const revenue = monthlyRevenue(invoices, MONTHS_BACK);
  const top = topClients(clients, invoices, 5);
  const slices = expensesByCategory(expenses, categories, MONTHS_BACK);
  const margins = projectMargins(projects, clients, expenses);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Pilotage"
        title="Rapports"
        description="Vue agrégée des 12 derniers mois : revenus, dépenses, marges projet, top clients."
      />

      {/* Period summary */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <MetricCard label="Encaissé (12 m)" value={summary.revenuePaid} tone="confirmed" />
        <MetricCard label="À encaisser" value={summary.revenueOutstanding} tone="probable" />
        <MetricCard label="Dépenses" value={summary.expenses} />
        <MetricCard
          label="Net encaissé"
          value={summary.netPaid}
          tone={summary.netPaid >= 0 ? "confirmed" : "danger"}
          hint="Encaissé − dépenses"
        />
      </div>

      {/* Revenue chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Revenus par mois</CardTitle>
          <CardDescription>
            En empilement : encaissé + à encaisser. Les brouillons et factures annulées sont exclus.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <RevenueChart data={revenue} />
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {/* Top clients */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 clients</CardTitle>
            <CardDescription>Classés par CA encaissé sur 12 mois.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {top.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-muted-foreground">
                Pas encore de revenu encaissé sur la période.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Encaissé</TableHead>
                    <TableHead className="text-right">À encaisser</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {top.map(({ client, paid, outstanding }) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <Link href={`/clients/${client.id}`} className="font-medium hover:underline">
                          {client.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">
                        <Money amount={paid} className="text-confirmed" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Money
                          amount={outstanding}
                          className={outstanding > 0 ? "text-probable" : "text-muted-foreground"}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Expense breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Dépenses par catégorie</CardTitle>
            <CardDescription>Répartition sur 12 mois.</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryDonut slices={slices} />
          </CardContent>
        </Card>
      </div>

      {/* Project margins */}
      <Card>
        <CardHeader>
          <CardTitle>Marges par projet</CardTitle>
          <CardDescription>
            Marge = budget vendu − (budget interne + dépenses liées). Triées par marge absolue.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {margins.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted-foreground">Aucun projet à analyser.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projet</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Vendu</TableHead>
                  <TableHead className="text-right">Coût</TableHead>
                  <TableHead className="text-right">Marge</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {margins.map(({ project, client, cost, margin, marginPercent }) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <Link href={`/projets/${project.id}`} className="font-medium hover:underline">
                        {project.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{client?.name ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Money amount={project.soldBudget} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money amount={cost} className="text-muted-foreground" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money amount={margin} tone="auto" />
                    </TableCell>
                    <TableCell className="text-right num">
                      <span
                        className={
                          marginPercent < 0
                            ? "text-danger"
                            : marginPercent < 20
                              ? "text-warning"
                              : "text-confirmed"
                        }
                      >
                        {marginPercent}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground">
        Note : ces rapports sont un point de pilotage, pas une comptabilité officielle. Pour la
        déclaration fiscale ou la TVA, consulte ton comptable.
      </p>
    </div>
  );
}
