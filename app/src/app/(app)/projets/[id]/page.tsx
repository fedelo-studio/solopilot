import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { ProjectStatusBadge, InvoiceStatusBadge } from "@/components/shared/status-badge";
import { Money } from "@/components/shared/money";
import { Duration } from "@/components/shared/duration";
import { MetricCard } from "@/components/shared/metric-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProjectDetailTabs } from "@/components/projects/project-detail-tabs";
import { ProjectTasksTab } from "@/components/projects/project-tasks-tab";

import {
  getClientById,
  getCompanySettings,
  getExpensesByProject,
  getInvoices,
  getPeople,
  getProjectById,
  getTasksByProject,
  getTimeEntriesByProject,
} from "@/lib/data";
import { balanceDue, liveStatus } from "@/lib/finance/invoices";
import { formatDate } from "@/lib/finance/format";
import {
  budgetUtilizationPercent,
  hoursLogged,
  hoursRemaining,
  projectMargin,
  projectProgressPercent,
} from "@/lib/finance/projects";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();

  const [client, expenses, invoices, tasks, people, entries, company] = await Promise.all([
    getClientById(project.clientId),
    getExpensesByProject(project.id),
    getInvoices(),
    getTasksByProject(project.id),
    getPeople(),
    getTimeEntriesByProject(project.id),
    getCompanySettings(),
  ]);

  const projectInvoices = invoices.filter((i) => i.projectId === project.id);
  const expensesTotal = expenses.reduce((acc, e) => acc + e.amount, 0);
  const { cost, margin, marginPercent } = projectMargin(project, expensesTotal);
  const invoiced = projectInvoices.reduce((acc, i) => acc + i.total, 0);
  const collected = projectInvoices
    .filter((i) => liveStatus(i) === "paid")
    .reduce((acc, i) => acc + i.total, 0);

  const unbilledEntries = entries.filter((e) => e.billable && !e.invoiceId);
  const logged = hoursLogged(entries);
  const remaining = hoursRemaining(project, entries);
  const utilization = budgetUtilizationPercent(project, entries);
  const taskProgress = projectProgressPercent(tasks);

  const overview = (
    <>
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <MetricCard label="Budget vendu" value={project.soldBudget} tone="confirmed" />
        <MetricCard label="Coût engagé" value={cost} hint={`Interne + dépenses`} />
        <MetricCard
          label="Marge projetée"
          value={margin}
          tone={margin > 0 ? "confirmed" : "danger"}
          hint={`${marginPercent}%`}
        />
        <MetricCard
          label="Encaissé"
          value={collected}
          hint={`sur ${invoiced.toLocaleString("de-CH")} CHF facturés`}
          tone="confirmed"
        />
      </div>

      {/* Time & progress — derived from tasks + time entries, not stored fields. */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Temps & avancement</CardTitle>
          <CardDescription>
            {project.billingType === "hourly" ? "Projet facturé à l'heure." : "Projet non facturé au temps."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="mb-1.5 flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">Heures suivies</span>
              <span>
                <Duration minutes={logged * 60} className="font-medium text-foreground" />
                {project.budgetHours != null ? (
                  <span className="text-muted-foreground"> / {project.budgetHours} h budgétées</span>
                ) : null}
              </span>
            </div>
            {project.budgetHours != null ? (
              <>
                <Progress
                  value={Math.min(100, utilization ?? 0)}
                  indicatorClassName={
                    (utilization ?? 0) > 100
                      ? "bg-danger"
                      : (utilization ?? 0) >= 80
                        ? "bg-warning"
                        : "bg-confirmed"
                  }
                />
                <div className="mt-1.5 flex items-center justify-between text-xs">
                  <span className="num text-muted-foreground">{utilization ?? 0}%</span>
                  <span className={remaining != null && remaining < 0 ? "text-danger" : "text-muted-foreground"}>
                    {remaining != null && remaining < 0
                      ? `Dépassement de ${Math.abs(remaining).toFixed(1)} h`
                      : `Reste ${(remaining ?? 0).toFixed(1)} h`}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                Pas de budget d'heures défini — modifie le projet pour en fixer un.
              </p>
            )}
          </div>

          <div>
            <div className="mb-1.5 flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">Progression des tâches</span>
              <span className="num font-medium text-foreground">{taskProgress}%</span>
            </div>
            <Progress value={taskProgress} indicatorClassName="bg-probable" />
          </div>
        </CardContent>
      </Card>

      {/* Linked expenses */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Dépenses liées</CardTitle>
          <CardDescription>{expenses.length} mouvement(s) — impactent directement la marge.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {expenses.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted-foreground">Aucune dépense liée pour l'instant.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-muted-foreground">{formatDate(e.date)}</TableCell>
                    <TableCell className="font-medium">{e.vendor}</TableCell>
                    <TableCell className="text-muted-foreground">{e.description ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Money amount={e.amount} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Linked invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Factures du projet</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {projectInvoices.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted-foreground">
              Aucune facture liée au projet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Solde dû</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectInvoices.map((inv) => {
                  const status = liveStatus(inv);
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium num">#{inv.number}</TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(inv.dueDate)}</TableCell>
                      <TableCell className="text-right">
                        <Money amount={inv.total} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Money amount={balanceDue(inv)} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {project.notes ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{project.notes}</p>
          </CardContent>
        </Card>
      ) : null}
    </>
  );

  const tasksTab = (
    <ProjectTasksTab
      project={project}
      tasks={tasks}
      people={people}
      entries={entries}
      unbilledEntries={unbilledEntries}
      vatRate={company.defaultVatRate}
    />
  );

  return (
    <div className="mx-auto max-w-7xl">
      <Link
        href="/projets"
        className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-3 w-3" />
        Tous les projets
      </Link>

      <PageHeader
        eyebrow="Projet"
        title={project.name}
        description={
          <span className="inline-flex items-center gap-2">
            <ProjectStatusBadge status={project.status} />
            {client ? (
              <Link href={`/clients/${client.id}`} className="text-xs underline-offset-2 hover:underline">
                {client.name}
              </Link>
            ) : null}
            {project.startDate ? (
              <span className="text-xs text-muted-foreground">
                · Démarré le {formatDate(project.startDate)}
              </span>
            ) : null}
          </span>
        }
        actions={
          <Button asChild variant="outline">
            <Link href={`/projets/${project.id}/edit`}>
              <Pencil className="h-4 w-4" />
              Modifier
            </Link>
          </Button>
        }
      />

      <ProjectDetailTabs overview={overview} tasks={tasksTab} />
    </div>
  );
}
