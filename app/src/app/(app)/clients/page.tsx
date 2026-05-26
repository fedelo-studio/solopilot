import { Users } from "lucide-react";
import Link from "next/link";
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
import { ClientStatusBadge } from "@/components/shared/status-badge";
import { Money } from "@/components/shared/money";
import { EmptyState } from "@/components/shared/empty-state";
import { NewClientDialog } from "@/components/clients/new-client-dialog";
import { ClientRowActions } from "@/components/clients/client-row-actions";

import { getClients, getInvoices, getProjects } from "@/lib/data";
import { isOpen as isInvoiceOpen, balanceDue } from "@/lib/finance/invoices";

export default async function ClientsPage() {
  const [clients, invoices, projects] = await Promise.all([
    getClients(),
    getInvoices(),
    getProjects(),
  ]);

  // Pre-compute per-client KPIs.
  const stats = clients.map((c) => {
    const clientProjects = projects.filter((p) => p.clientId === c.id);
    const clientInvoices = invoices.filter((i) => i.clientId === c.id);
    const revenueTotal = clientInvoices
      .filter((i) => i.status === "paid")
      .reduce((acc, i) => acc + i.total, 0);
    const openInvoicesAmount = clientInvoices
      .filter(isInvoiceOpen)
      .reduce((acc, i) => acc + balanceDue(i), 0);
    return { client: c, projects: clientProjects.length, revenueTotal, openInvoicesAmount };
  });

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Commercial"
        title="Clients"
        description="Tes clients actifs, prospects et archives. Les prospects deviennent clients au moment de la signature d'un deal."
        actions={<NewClientDialog />}
      />

      <Card>
        <CardContent className="p-0">
          {stats.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Aucun client pour l'instant"
              description="Ajoute un client depuis le pipeline ou directement ici."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Projets</TableHead>
                  <TableHead className="text-right">CA payé</TableHead>
                  <TableHead className="text-right">À encaisser</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map(({ client, projects, revenueTotal, openInvoicesAmount }) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Link href={`/clients/${client.id}`} className="font-medium hover:underline">
                        {client.name}
                      </Link>
                      {client.email ? (
                        <div className="text-xs text-muted-foreground">{client.email}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <ClientStatusBadge status={client.status} />
                    </TableCell>
                    <TableCell className="text-right num">{projects}</TableCell>
                    <TableCell className="text-right">
                      <Money amount={revenueTotal} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money
                        amount={openInvoicesAmount}
                        className={
                          openInvoicesAmount > 0 ? "text-probable" : "text-muted-foreground"
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <ClientRowActions clientId={client.id} clientName={client.name} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
