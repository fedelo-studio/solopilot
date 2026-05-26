import Link from "next/link";
import { Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { AccountRowActions } from "@/components/accounts/account-row-actions";

import { getAccounts, getTransactions } from "@/lib/data";
import { formatDate } from "@/lib/finance/format";

export default async function ComptesPage() {
  const [accounts, transactions] = await Promise.all([getAccounts(), getTransactions()]);
  const totalCash = accounts.reduce((acc, a) => acc + a.initialBalance, 0);
  const accountById = new Map(accounts.map((a) => [a.id, a]));

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Finances"
        title="Comptes & transactions"
        description="Vue consolidée de tes comptes et des mouvements importés."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/comptes/nouveau">
                <Plus className="h-4 w-4" />
                Nouveau compte
              </Link>
            </Button>
            <Button asChild>
              <Link href="/comptes/import">
                <Upload className="h-4 w-4" />
                Importer un CSV
              </Link>
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <MetricCard label="Solde total" value={totalCash} tone="confirmed" />
        <MetricCard
          label="Comptes"
          value={accounts.length}
          asMoney={false}
          hint={`${accounts.filter((a) => a.kind === "bank").length} bancaire(s)`}
        />
        <MetricCard
          label="Transactions"
          value={transactions.length}
          asMoney={false}
          hint="Toutes périodes confondues"
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Comptes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Solde initial</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{a.kind}</TableCell>
                  <TableCell className="text-right">
                    <Money amount={a.initialBalance} />
                  </TableCell>
                  <TableCell className="text-right">
                    <AccountRowActions accountId={a.id} accountName={a.name} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dernières transactions</CardTitle>
          <CardDescription>Mouvements bancaires importés ou créés manuellement.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted-foreground">
              Aucune transaction pour l'instant. Importe un CSV pour commencer.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Compte</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.slice(0, 50).map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-muted-foreground">{formatDate(t.date)}</TableCell>
                    <TableCell>{accountById.get(t.accountId)?.name ?? "—"}</TableCell>
                    <TableCell>{t.label}</TableCell>
                    <TableCell className="text-right">
                      <Money
                        amount={t.kind === "in" ? t.amount : -t.amount}
                        tone="auto"
                      />
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
