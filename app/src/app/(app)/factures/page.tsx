import { Plus, Receipt } from "lucide-react";
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
import { InvoiceStatusBadge } from "@/components/shared/status-badge";
import { Money } from "@/components/shared/money";
import { MetricCard } from "@/components/shared/metric-card";
import { EmptyState } from "@/components/shared/empty-state";
import { DueDate } from "@/components/shared/due-date";
import { InvoiceRowActions } from "@/components/invoices/invoice-row-actions";

import { getClients, getInvoices } from "@/lib/data";
import { formatDate } from "@/lib/finance/format";
import { balanceDue, liveStatus, totalOwed } from "@/lib/finance/invoices";

export default async function FacturesPage() {
  const [clients, invoices] = await Promise.all([getClients(), getInvoices()]);
  const clientById = new Map(clients.map((c) => [c.id, c]));

  const sorted = [...invoices].sort(
    (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
  );

  const owed = totalOwed(invoices);
  const overdueAmount = invoices
    .filter((i) => liveStatus(i) === "overdue")
    .reduce((acc, i) => acc + balanceDue(i), 0);
  const paidThisYear = invoices
    .filter((i) => i.status === "paid")
    .reduce((acc, i) => acc + i.total, 0);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Finances"
        title="Factures"
        description="Suivi des factures par statut. Une facture devient automatiquement en retard à dépassement de l'échéance."
        actions={
          <Button asChild>
            <Link href="/factures/nouvelle">
              <Plus className="h-4 w-4" />
              Nouvelle facture
            </Link>
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <MetricCard label="À encaisser" value={owed} tone="probable" hint="Factures envoyées et en retard" />
        <MetricCard label="En retard" value={overdueAmount} tone={overdueAmount > 0 ? "danger" : "neutral"} hint="Action prioritaire" />
        <MetricCard label="Payées cette année" value={paidThisYear} tone="confirmed" />
      </div>

      <Card>
        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Pas encore de facture"
              description="Crée une facture depuis un projet ou ici directement."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Émise le</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead className="text-right">Total TTC</TableHead>
                  <TableHead className="text-right">Solde dû</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((inv) => {
                  const client = clientById.get(inv.clientId);
                  const status = liveStatus(inv);
                  const resolved = status === "paid" || status === "cancelled";
                  return (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <Link
                          href={`/factures/${inv.id}`}
                          className="num font-medium hover:underline"
                        >
                          #{inv.number}
                        </Link>
                      </TableCell>
                      <TableCell>{client?.name ?? "—"}</TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(inv.issuedAt)}
                      </TableCell>
                      <TableCell>
                        <DueDate date={inv.dueDate} resolved={resolved} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Money amount={inv.total} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Money
                          amount={balanceDue(inv)}
                          className={
                            status === "overdue"
                              ? "text-danger"
                              : status === "paid"
                                ? "text-muted-foreground"
                                : "text-foreground"
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <InvoiceRowActions invoiceId={inv.id} invoiceNumber={inv.number} />
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
