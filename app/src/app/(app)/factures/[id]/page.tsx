import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, FileDown, ExternalLink, Pencil } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { InvoiceStatusBadge } from "@/components/shared/status-badge";
import { Money } from "@/components/shared/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  getClientById,
  getInvoiceById,
  getPaymentsByInvoice,
  getProjectById,
} from "@/lib/data";
import { balanceDue, liveStatus } from "@/lib/finance/invoices";
import { formatDate, formatRelativeDate, daysUntil } from "@/lib/finance/format";
import { PAYMENT_METHOD_LABELS } from "@/types/domain";
import { RecordPaymentDialog } from "@/components/invoices/record-payment-dialog";
import { InvoiceActions } from "@/components/invoices/invoice-actions";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);
  if (!invoice) notFound();

  const [client, project, payments] = await Promise.all([
    getClientById(invoice.clientId),
    invoice.projectId ? getProjectById(invoice.projectId) : Promise.resolve(null),
    getPaymentsByInvoice(invoice.id),
  ]);

  const status = liveStatus(invoice);
  const balance = balanceDue(invoice);
  const fullyPaid = balance <= 0;
  const overdueDays = daysUntil(invoice.dueDate);

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/factures"
        className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-3 w-3" />
        Toutes les factures
      </Link>

      <PageHeader
        eyebrow={`Facture · ${formatDate(invoice.issuedAt)}`}
        title={`#${invoice.number}`}
        description={
          <span className="inline-flex items-center gap-2">
            <InvoiceStatusBadge status={status} />
            {client ? (
              <Link href={`/clients/${client.id}`} className="text-xs underline-offset-2 hover:underline">
                {client.name}
              </Link>
            ) : null}
            {project ? (
              <span className="text-xs text-muted-foreground">
                · projet{" "}
                <Link href={`/projets/${project.id}`} className="underline-offset-2 hover:underline">
                  {project.name}
                </Link>
              </span>
            ) : null}
          </span>
        }
        actions={
          <>
            <Button asChild variant="ghost">
              <Link href={`/factures/${invoice.id}/edit`}>
                <Pencil className="h-4 w-4" />
                Modifier
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/factures/${invoice.id}/pdf`} target="_blank">
                <FileDown className="h-4 w-4" />
                PDF
              </Link>
            </Button>
            <RecordPaymentDialog
              invoiceId={invoice.id}
              defaultAmount={balance > 0 ? balance : invoice.total}
              disabled={fullyPaid || status === "cancelled" || status === "draft"}
            />
          </>
        }
      />

      {/* Top metrics — total / paid / balance / due */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Snapshot label="Total TTC" value={invoice.total} />
        <Snapshot label="Encaissé" value={invoice.amountPaid} tone="confirmed" />
        <Snapshot
          label="Solde dû"
          value={balance}
          tone={balance === 0 ? "confirmed" : status === "overdue" ? "danger" : "default"}
        />
        <DueSnapshot dueDate={invoice.dueDate} status={status} overdueDays={overdueDays} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Lines + payments — left, 2 cols */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Lignes</CardTitle>
              <CardDescription>{invoice.lines.length} ligne(s) — TVA calculée par ligne.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qté</TableHead>
                    <TableHead className="text-right">Prix unit.</TableHead>
                    <TableHead className="text-right">TVA</TableHead>
                    <TableHead className="text-right">Total HT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>{line.description}</TableCell>
                      <TableCell className="text-right num">{line.quantity}</TableCell>
                      <TableCell className="text-right">
                        <Money amount={line.unitPrice} />
                      </TableCell>
                      <TableCell className="text-right num text-muted-foreground">
                        {line.vatRate}%
                      </TableCell>
                      <TableCell className="text-right">
                        <Money amount={line.total} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="px-5 pb-5">
                <Separator className="my-4" />
                <div className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
                  <Row label="Sous-total" amount={invoice.subtotal} muted />
                  <Row label="TVA" amount={invoice.vatAmount} muted />
                  <div className="border-t border-border pt-1.5">
                    <Row label="Total TTC" amount={invoice.total} bold />
                  </div>
                  {invoice.amountPaid > 0 ? (
                    <Row label="Encaissé" amount={-invoice.amountPaid} muted />
                  ) : null}
                  {balance > 0 ? <Row label="Solde dû" amount={balance} bold /> : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Paiements</CardTitle>
              <CardDescription>
                {payments.length === 0
                  ? "Aucun paiement enregistré pour cette facture."
                  : `${payments.length} paiement${payments.length > 1 ? "s" : ""} reçu${
                      payments.length > 1 ? "s" : ""
                    }.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Méthode</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-muted-foreground">{formatDate(p.paidOn)}</TableCell>
                        <TableCell>
                          <Badge variant="confirmed">{PAYMENT_METHOD_LABELS[p.method]}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{p.notes ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <Money amount={p.amount} className="text-confirmed" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : null}
            </CardContent>
          </Card>

          {invoice.notes ? (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Actions sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Transitions de statut et relance.</CardDescription>
            </CardHeader>
            <CardContent>
              <InvoiceActions
                invoiceId={invoice.id}
                status={invoice.status}
                isOverdue={status === "overdue"}
                fullyPaid={fullyPaid}
              />
            </CardContent>
          </Card>

          {invoice.lastRemindedAt ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Dernière relance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{formatRelativeDate(invoice.lastRemindedAt)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(invoice.lastRemindedAt)}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {client ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <Link
                  href={`/clients/${client.id}`}
                  className="flex items-center gap-1 font-medium hover:underline"
                >
                  {client.name}
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </Link>
                {client.email ? (
                  <a
                    href={`mailto:${client.email}`}
                    className="block text-xs text-muted-foreground hover:underline"
                  >
                    {client.email}
                  </a>
                ) : null}
                {client.address ? (
                  <p className="text-xs text-muted-foreground">{client.address}</p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Le statut <em>payé</em> est calculé automatiquement quand la somme des paiements atteint
        le total TTC. La TVA appliquée par ligne reste une hypothèse produit — à valider avec un
        comptable.
      </p>
    </div>
  );
}

function Snapshot({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "confirmed" | "danger";
}) {
  const toneClass =
    tone === "confirmed" ? "text-confirmed" : tone === "danger" ? "text-danger" : "text-foreground";
  return (
    <Card>
      <CardContent className="p-5">
        <div className="eyebrow">{label}</div>
        <Money amount={value} className={`mt-2 block text-xl font-medium ${toneClass}`} />
      </CardContent>
    </Card>
  );
}

function DueSnapshot({
  dueDate,
  status,
  overdueDays,
}: {
  dueDate: string;
  status: import("@/types/domain").InvoiceStatus;
  overdueDays: number;
}) {
  const isPast = overdueDays < 0;
  return (
    <Card>
      <CardContent className="p-5">
        <div className="eyebrow">Échéance</div>
        <div className="mt-2 text-lg font-medium tracking-tight">{formatDate(dueDate)}</div>
        <div
          className={`mt-1 text-xs ${
            status === "overdue"
              ? "text-danger"
              : status === "paid"
                ? "text-confirmed"
                : "text-muted-foreground"
          }`}
        >
          {status === "paid"
            ? "Facture réglée"
            : status === "cancelled"
              ? "Facture annulée"
              : isPast
                ? `${Math.abs(overdueDays)} jour${Math.abs(overdueDays) > 1 ? "s" : ""} de retard`
                : overdueDays === 0
                  ? "Échéance aujourd'hui"
                  : `Dans ${overdueDays} jour${overdueDays > 1 ? "s" : ""}`}
        </div>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  amount,
  bold,
  muted,
}: {
  label: string;
  amount: number;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${bold ? "font-medium text-foreground" : muted ? "text-muted-foreground" : ""}`}
    >
      <span>{label}</span>
      <Money amount={amount} />
    </div>
  );
}
