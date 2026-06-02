import { FolderKanban, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { PageHeader } from "@/components/shared/page-header";
import { ProjectRowActions } from "@/components/projects/project-row-actions";
import { ProjectStatusBadge } from "@/components/shared/status-badge";
import { Money } from "@/components/shared/money";
import { EmptyState } from "@/components/shared/empty-state";

import { getClients, getExpenses, getProjects } from "@/lib/data";
import { formatDate } from "@/lib/finance/format";

export default async function ProjetsPage() {
  const [clients, expenses, projects] = await Promise.all([
    getClients(),
    getExpenses(),
    getProjects(),
  ]);
  const clientById = new Map(clients.map((c) => [c.id, c]));

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Opérations"
        title="Projets"
        description={
          <>
            La marge réelle d&apos;un projet =
            <span className="font-medium text-foreground"> vendu − interne − dépenses liées</span>.
            Cette vue agrège les dépenses rattachées à chaque projet.
          </>
        }
        actions={
          <Button asChild>
            <Link href="/projets/nouveau">
              <Plus className="h-4 w-4" />
              Nouveau projet
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {projects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="Pas encore de projet"
              description="Crée un projet lorsque qu'un deal est signé pour suivre son budget et sa marge."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projet</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Vendu</TableHead>
                  <TableHead className="text-right">Interne + dépenses</TableHead>
                  <TableHead className="text-right">Marge</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((p) => {
                  const client = clientById.get(p.clientId);
                  const linkedExpenses = expenses
                    .filter((e) => e.link.type === "project" && e.link.id === p.id)
                    .reduce((acc, e) => acc + e.amount, 0);
                  const totalCost = p.internalBudget + linkedExpenses;
                  const margin = p.soldBudget - totalCost;
                  const marginPercent =
                    p.soldBudget > 0 ? Math.round((margin / p.soldBudget) * 100) : 0;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link href={`/projets/${p.id}`} className="font-medium hover:underline">
                          {p.name}
                        </Link>
                        {p.startDate ? (
                          <div className="text-xs text-muted-foreground">
                            Démarré le {formatDate(p.startDate)}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>{client?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>
                        <ProjectStatusBadge status={p.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Money amount={p.soldBudget} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Money amount={totalCost} className="text-muted-foreground" />
                        <div className="text-meta">
                          dont <span className="num">{Math.round(linkedExpenses)} CHF</span> dépenses
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Money amount={margin} tone="auto" />
                        <div className="text-meta-num">{marginPercent}%</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <ProjectRowActions projectId={p.id} projectName={p.name} />
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
