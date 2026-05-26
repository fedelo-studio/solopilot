import Link from "next/link";
import { Plus, FileSignature } from "lucide-react";
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
import { QuoteStatusBadge } from "@/components/shared/status-badge";
import { Money } from "@/components/shared/money";
import { MetricCard } from "@/components/shared/metric-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ValidityDate } from "@/components/shared/due-date";
import { QuoteRowActions } from "@/components/quotes/quote-row-actions";

import { getClients, getQuotes } from "@/lib/data";
import { formatDate } from "@/lib/finance/format";
import { isOpenQuote, liveQuoteStatus, totalOpenQuotes } from "@/lib/finance/quotes";

export default async function DevisPage() {
  const [clients, quotes] = await Promise.all([getClients(), getQuotes()]);
  const clientById = new Map(clients.map((c) => [c.id, c]));

  const sorted = [...quotes].sort(
    (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
  );

  const openTotal = totalOpenQuotes(quotes);
  const acceptedTotal = quotes
    .filter((q) => q.status === "accepted")
    .reduce((acc, q) => acc + q.total, 0);
  const openCount = quotes.filter(isOpenQuote).length;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Commercial"
        title="Devis"
        description="Propositions commerciales envoyées aux prospects et clients. Un devis accepté peut être converti en facture."
        actions={
          <Button asChild>
            <Link href="/devis/nouveau">
              <Plus className="h-4 w-4" />
              Nouveau devis
            </Link>
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <MetricCard label="En attente client" value={openTotal} tone="probable" hint={`${openCount} devis ouverts`} />
        <MetricCard
          label="Acceptés cette année"
          value={acceptedTotal}
          tone="confirmed"
          hint={`${quotes.filter((q) => q.status === "accepted").length} devis signés`}
        />
        <MetricCard
          label="Total émis"
          value={quotes.reduce((acc, q) => acc + q.total, 0)}
          hint={`${quotes.length} devis au total`}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <EmptyState
              icon={FileSignature}
              title="Aucun devis pour l'instant"
              description="Crée ton premier devis pour formaliser une proposition commerciale."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Émis le</TableHead>
                  <TableHead>Validité</TableHead>
                  <TableHead className="text-right">Total TTC</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((q) => {
                  const client = clientById.get(q.clientId);
                  const status = liveQuoteStatus(q);
                  const resolved = status === "accepted" || status === "declined";
                  return (
                    <TableRow key={q.id}>
                      <TableCell>
                        <Link
                          href={`/devis/${q.id}`}
                          className="num font-medium hover:underline"
                        >
                          {q.number}
                        </Link>
                      </TableCell>
                      <TableCell>{client?.name ?? "—"}</TableCell>
                      <TableCell>
                        <QuoteStatusBadge status={status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(q.issuedAt)}</TableCell>
                      <TableCell>
                        {q.validUntil ? (
                          <ValidityDate date={q.validUntil} resolved={resolved} />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Money amount={q.total} />
                      </TableCell>
                      <TableCell className="text-right">
                        <QuoteRowActions quoteId={q.id} quoteNumber={q.number} />
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
