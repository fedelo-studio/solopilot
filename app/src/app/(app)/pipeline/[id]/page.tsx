import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ExternalLink, Pencil } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Money } from "@/components/shared/money";
import { Button } from "@/components/ui/button";
import { DealStageMenu } from "@/components/pipeline/deal-stage-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  getDealById,
  getExpenses,
} from "@/lib/data";
import { weightedValue } from "@/lib/finance/deals";
import { formatDate, formatRelativeDate } from "@/lib/finance/format";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await getDealById(id);
  if (!deal) notFound();

  const [client, expenses] = await Promise.all([
    deal.clientId ? getClientById(deal.clientId) : Promise.resolve(null),
    getExpenses(),
  ]);

  const linkedExpenses = expenses.filter(
    (e) => e.link.type === "deal" && e.link.id === deal.id,
  );
  const totalExpenses = linkedExpenses.reduce((acc, e) => acc + e.amount, 0);
  const weighted = weightedValue(deal);
  const margin = weighted - totalExpenses;

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/pipeline"
        className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-3 w-3" />
        Pipeline
      </Link>

      <PageHeader
        eyebrow="Deal"
        title={deal.title}
        description={
          <span className="inline-flex items-center gap-2">
            <DealStageMenu dealId={deal.id} stage={deal.stage} size="md" />
            {client ? (
              <Link
                href={`/clients/${client.id}`}
                className="inline-flex items-center gap-0.5 text-xs underline-offset-2 hover:underline"
              >
                {client.name}
                <ExternalLink className="h-3 w-3 opacity-60" />
              </Link>
            ) : (
              <span className="text-xs italic text-muted-foreground">Prospect direct</span>
            )}
          </span>
        }
        actions={
          <Button asChild>
            <Link href={`/pipeline/${deal.id}/edit`}>
              <Pencil className="h-4 w-4" />
              Modifier
            </Link>
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Snapshot label="Estimé" value={deal.estimatedAmount} />
        <Snapshot label="Pondéré" value={weighted} tone="probable" hint={`${deal.probability}%`} />
        <Snapshot label="Dépenses liées" value={totalExpenses} hint={`${linkedExpenses.length} lignes`} />
        <Snapshot
          label="Marge potentielle"
          value={margin}
          tone={margin > 0 ? "confirmed" : "danger"}
          hint="Pondéré − dépenses"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Calendrier prévisionnel</CardTitle>
            <CardDescription>Dates clés du cycle commercial.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Signature attendue" value={deal.expectedSignatureDate} />
            <Row label="Paiement attendu" value={deal.expectedPaymentDate} />
            <Row label="Créé le" value={deal.createdAt.slice(0, 10)} />
            {deal.wonAt ? <Row label="Gagné le" value={deal.wonAt.slice(0, 10)} /> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{deal.source ?? <span className="text-muted-foreground">—</span>}</p>
            {deal.notes ? (
              <p className="rounded-md border border-border bg-muted/30 p-2 text-xs text-muted-foreground">
                {deal.notes}
              </p>
            ) : null}
            {deal.lostReason ? (
              <p className="text-xs text-danger">Raison du refus : {deal.lostReason}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {linkedExpenses.length > 0 ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Dépenses liées</CardTitle>
            <CardDescription>
              Ces dépenses sont attribuées à ce deal — elles réduisent la marge potentielle.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
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
                {linkedExpenses.map((e) => (
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
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Snapshot({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: number;
  tone?: "confirmed" | "probable" | "danger";
  hint?: string;
}) {
  const toneClass =
    tone === "confirmed"
      ? "text-confirmed"
      : tone === "probable"
        ? "text-probable"
        : tone === "danger"
          ? "text-danger"
          : "text-foreground";
  return (
    <Card>
      <CardContent className="p-5">
        <div className="eyebrow">{label}</div>
        <Money amount={value} className={`mt-2 block text-xl font-medium ${toneClass}`} />
        {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value ? formatRelativeDate(value) : "—"}</span>
    </div>
  );
}
