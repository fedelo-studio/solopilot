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
import { Duration } from "@/components/shared/duration";
import { MetricCard } from "@/components/shared/metric-card";
import { RevenueChart } from "@/components/reports/revenue-chart";
import { CategoryDonut } from "@/components/reports/category-donut";
import { ExportCsvButton } from "@/components/reports/export-csv-button";
import { toCsv, type CsvColumn } from "@/lib/csv-export";

import {
  getClients,
  getExpenseCategories,
  getExpenses,
  getInvoices,
  getPeople,
  getProjects,
  getTasks,
  getTimeEntries,
} from "@/lib/data";
import {
  billableUtilization,
  estimateVsActualRows,
  expensesByCategory,
  hoursByPerson,
  hoursByProject,
  monthlyRevenue,
  periodSummary,
  projectMargins,
  topClients,
  type ProjectHoursRow,
  type ProjectMarginRow,
  type PersonHoursRow,
  type TaskEstimateRow,
} from "@/lib/finance/reports";

const MONTHS_BACK = 12;

const HOURS_BY_PROJECT_COLUMNS: CsvColumn<ProjectHoursRow>[] = [
  { header: "Projet", value: (r) => r.project.name },
  { header: "Client", value: (r) => r.client?.name ?? "" },
  { header: "Heures totales", value: (r) => r.hours.toFixed(2) },
  { header: "Heures facturables", value: (r) => r.billableHours.toFixed(2) },
  { header: "Heures non facturables", value: (r) => r.nonBillableHours.toFixed(2) },
  { header: "% facturable", value: (r) => r.billablePercent },
];

const HOURS_BY_PERSON_COLUMNS: CsvColumn<PersonHoursRow>[] = [
  { header: "Personne", value: (r) => r.person.name },
  { header: "Heures totales", value: (r) => r.hours.toFixed(2) },
  { header: "Heures facturables", value: (r) => r.billableHours.toFixed(2) },
  { header: "Heures non facturables", value: (r) => r.nonBillableHours.toFixed(2) },
  { header: "% facturable", value: (r) => r.billablePercent },
];

const ESTIMATE_VS_ACTUAL_COLUMNS: CsvColumn<TaskEstimateRow>[] = [
  { header: "Tâche", value: (r) => r.task.title },
  { header: "Projet", value: (r) => r.project.name },
  { header: "Estimé (h)", value: (r) => r.estimatedHours.toFixed(2) },
  { header: "Réel (h)", value: (r) => r.actualHours.toFixed(2) },
  { header: "Écart (h)", value: (r) => r.deltaHours.toFixed(2) },
  { header: "Écart (%)", value: (r) => r.deltaPercent ?? "" },
];

const PROJECT_MARGINS_COLUMNS: CsvColumn<ProjectMarginRow>[] = [
  { header: "Projet", value: (r) => r.project.name },
  { header: "Client", value: (r) => r.client?.name ?? "" },
  { header: "Vendu", value: (r) => r.project.soldBudget },
  { header: "Coût", value: (r) => r.cost },
  { header: "Marge", value: (r) => r.margin },
  { header: "Marge %", value: (r) => r.marginPercent },
  { header: "Heures suivies", value: (r) => r.hoursLogged.toFixed(2) },
  { header: "Coût du temps", value: (r) => r.timeCost.toFixed(2) },
];

export default async function RapportsPage() {
  const [clients, invoices, expenses, categories, projects, people, tasks, timeEntries] =
    await Promise.all([
      getClients(),
      getInvoices(),
      getExpenses(),
      getExpenseCategories(),
      getProjects(),
      getPeople(),
      getTasks(),
      getTimeEntries(),
    ]);

  const summary = periodSummary(invoices, expenses, MONTHS_BACK);
  const revenue = monthlyRevenue(invoices, MONTHS_BACK);
  const top = topClients(clients, invoices, 5);
  const slices = expensesByCategory(expenses, categories, MONTHS_BACK);
  const margins = projectMargins(projects, clients, expenses, timeEntries, people);
  const projectHours = hoursByProject(projects, clients, timeEntries);
  const personHours = hoursByPerson(people, timeEntries);
  const billable = billableUtilization(timeEntries);
  const estimateRows = estimateVsActualRows(projects, tasks, timeEntries);

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

      {/* Time summary — toutes périodes, dérivé des entrées de temps suivies. */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <MetricCard
          label="Heures suivies"
          value={billable.billableHours + billable.nonBillableHours}
          asMoney={false}
          hint="toutes périodes"
        />
        <MetricCard
          label="Taux de facturation"
          value={billable.billablePercent}
          asMoney={false}
          hint="% du temps suivi facturable"
          tone={billable.billablePercent >= 70 ? "confirmed" : billable.billablePercent >= 40 ? "warning" : "danger"}
        />
      </div>

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
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Marges par projet</CardTitle>
            <CardDescription>
              Marge = budget vendu − (budget interne + dépenses liées). Heures et coût du temps sont
              informatifs — ils n&apos;entrent pas dans le calcul de la marge.
            </CardDescription>
          </div>
          <ExportCsvButton
            csv={toCsv(margins, PROJECT_MARGINS_COLUMNS)}
            filename="marges-par-projet.csv"
            disabled={margins.length === 0}
          />
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
                  <TableHead className="text-right">Heures</TableHead>
                  <TableHead className="text-right">Coût du temps</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {margins.map(({ project, client, cost, margin, marginPercent, hoursLogged, timeCost }) => (
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
                    <TableCell className="text-right">
                      <Duration minutes={hoursLogged * 60} className="text-muted-foreground" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money amount={timeCost} className="text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {/* Hours by project */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle>Heures par projet</CardTitle>
              <CardDescription>Toutes périodes, facturable vs non facturable.</CardDescription>
            </div>
            <ExportCsvButton
              csv={toCsv(projectHours, HOURS_BY_PROJECT_COLUMNS)}
              filename="heures-par-projet.csv"
              disabled={projectHours.length === 0}
            />
          </CardHeader>
          <CardContent className="p-0">
            {projectHours.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-muted-foreground">Aucun temps suivi pour l'instant.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projet</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">% facturable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectHours.map((r) => (
                    <TableRow key={r.project.id}>
                      <TableCell>
                        <Link href={`/projets/${r.project.id}`} className="font-medium hover:underline">
                          {r.project.name}
                        </Link>
                        <div className="text-meta text-muted-foreground">{r.client?.name ?? "—"}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Duration minutes={r.hours * 60} />
                      </TableCell>
                      <TableCell className="text-right num">{r.billablePercent}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Hours by person */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle>Heures par personne</CardTitle>
              <CardDescription>Utilisation — toutes périodes.</CardDescription>
            </div>
            <ExportCsvButton
              csv={toCsv(personHours, HOURS_BY_PERSON_COLUMNS)}
              filename="heures-par-personne.csv"
              disabled={personHours.length === 0}
            />
          </CardHeader>
          <CardContent className="p-0">
            {personHours.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-muted-foreground">Aucun temps suivi pour l'instant.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Personne</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">% facturable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {personHours.map((r) => (
                    <TableRow key={r.person.id}>
                      <TableCell className="font-medium">{r.person.name}</TableCell>
                      <TableCell className="text-right">
                        <Duration minutes={r.hours * 60} />
                      </TableCell>
                      <TableCell className="text-right num">{r.billablePercent}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Estimated vs actual */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Estimé vs réel</CardTitle>
            <CardDescription>
              Tâches avec une estimation d&apos;heures, triées par plus gros écart absolu.
            </CardDescription>
          </div>
          <ExportCsvButton
            csv={toCsv(estimateRows, ESTIMATE_VS_ACTUAL_COLUMNS)}
            filename="estime-vs-reel.csv"
            disabled={estimateRows.length === 0}
          />
        </CardHeader>
        <CardContent className="p-0">
          {estimateRows.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted-foreground">
              Aucune tâche avec une estimation pour l'instant.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tâche</TableHead>
                  <TableHead>Projet</TableHead>
                  <TableHead className="text-right">Estimé</TableHead>
                  <TableHead className="text-right">Réel</TableHead>
                  <TableHead className="text-right">Écart</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estimateRows.map((r) => (
                  <TableRow key={r.task.id}>
                    <TableCell className="font-medium">{r.task.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <Link href={`/projets/${r.project.id}`} className="hover:underline">
                        {r.project.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <Duration minutes={r.estimatedHours * 60} className="text-muted-foreground" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Duration minutes={r.actualHours * 60} />
                    </TableCell>
                    <TableCell className="text-right num">
                      <span className={r.deltaHours > 0 ? "text-danger" : "text-confirmed"}>
                        {r.deltaHours > 0 ? "+" : ""}
                        {r.deltaHours.toFixed(1)} h
                        {r.deltaPercent != null ? ` (${r.deltaPercent > 0 ? "+" : ""}${r.deltaPercent}%)` : ""}
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
