import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, FileDown, ExternalLink, Pencil } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { QuoteStatusBadge } from "@/components/shared/status-badge";
import { Money } from "@/components/shared/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getClientById, getQuoteById } from "@/lib/data";
import { formatDate, daysUntil } from "@/lib/finance/format";
import { liveQuoteStatus } from "@/lib/finance/quotes";
import { QuoteActions } from "@/components/quotes/quote-actions";

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await getQuoteById(id);
  if (!quote) notFound();

  const client = await getClientById(quote.clientId);
  const status = liveQuoteStatus(quote);
  const days = quote.validUntil ? daysUntil(quote.validUntil) : null;

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/devis"
        className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-3 w-3" />
        Tous les devis
      </Link>

      <PageHeader
        eyebrow={`Devis · ${formatDate(quote.issuedAt)}`}
        title={quote.number}
        description={
          <span className="inline-flex items-center gap-2">
            <QuoteStatusBadge status={status} />
            {client ? (
              <Link href={`/clients/${client.id}`} className="text-xs underline-offset-2 hover:underline">
                {client.name}
              </Link>
            ) : null}
            {quote.convertedInvoiceId ? (
              <Link
                href={`/factures/${quote.convertedInvoiceId}`}
                className="inline-flex items-center gap-0.5 text-xs text-confirmed underline-offset-2 hover:underline"
              >
                Voir la facture <ExternalLink className="h-3 w-3" />
              </Link>
            ) : null}
          </span>
        }
        actions={
          <>
            <Button asChild variant="ghost">
              <Link href={`/devis/${quote.id}/edit`}>
                <Pencil className="h-4 w-4" />
                Modifier
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/devis/${quote.id}/pdf`} target="_blank">
                <FileDown className="h-4 w-4" />
                PDF
              </Link>
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Snapshot label="Total TTC" value={quote.total} />
        <Snapshot label="Sous-total HT" value={quote.subtotal} muted />
        <Snapshot label="TVA" value={quote.vatAmount} muted />
        <Card>
          <CardContent className="p-5">
            <div className="eyebrow">Validité</div>
            {quote.validUntil ? (
              <>
                <div className="mt-2 text-lg font-medium tracking-tight">{formatDate(quote.validUntil)}</div>
                <div
                  className={`mt-1 text-xs ${
                    days != null && days < 0 && status !== "accepted"
                      ? "text-warning"
                      : "text-muted-foreground"
                  }`}
                >
                  {days == null
                    ? ""
                    : days < 0
                      ? `expiré il y a ${Math.abs(days)} jour${Math.abs(days) > 1 ? "s" : ""}`
                      : `${days} jour${days > 1 ? "s" : ""} restants`}
                </div>
              </>
            ) : (
              <div className="mt-2 text-sm text-muted-foreground">Sans expiration</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Lignes</CardTitle>
              <CardDescription>{quote.lines.length} ligne(s) — TVA calculée par ligne.</CardDescription>
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
                  {quote.lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>{line.description}</TableCell>
                      <TableCell className="text-right num">{line.quantity}</TableCell>
                      <TableCell className="text-right"><Money amount={line.unitPrice} /></TableCell>
                      <TableCell className="text-right num text-muted-foreground">{line.vatRate}%</TableCell>
                      <TableCell className="text-right"><Money amount={line.total} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="px-5 pb-5">
                <Separator className="my-4" />
                <div className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
                  <Row label="Sous-total" amount={quote.subtotal} muted />
                  <Row label="TVA" amount={quote.vatAmount} muted />
                  <div className="border-t border-border pt-1.5">
                    <Row label="Total TTC" amount={quote.total} bold />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {quote.notes ? (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{quote.notes}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Transitions et conversion en facture.</CardDescription>
            </CardHeader>
            <CardContent>
              <QuoteActions
                quoteId={quote.id}
                status={quote.status}
                alreadyConverted={Boolean(quote.convertedInvoiceId)}
              />
            </CardContent>
          </Card>

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
                  <a href={`mailto:${client.email}`} className="block text-xs text-muted-foreground hover:underline">
                    {client.email}
                  </a>
                ) : null}
                {client.address ? <p className="text-xs text-muted-foreground">{client.address}</p> : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Snapshot({
  label,
  value,
  muted,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="eyebrow">{label}</div>
        <Money
          amount={value}
          className={`mt-2 block text-xl font-medium ${muted ? "text-muted-foreground" : ""}`}
        />
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
      className={`flex justify-between ${
        bold ? "font-medium text-foreground" : muted ? "text-muted-foreground" : ""
      }`}
    >
      <span>{label}</span>
      <Money amount={amount} />
    </div>
  );
}
