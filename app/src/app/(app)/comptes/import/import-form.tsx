"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormField } from "@/components/shared/form-field";
import { Money } from "@/components/shared/money";
import { Badge } from "@/components/ui/badge";
import { parseCsv, rowsToTransactions, type ParsedTransaction } from "@/lib/finance/csv";
import { importTransactions } from "@/app/actions/transactions";
import { formatDate } from "@/lib/finance/format";
import type { Account } from "@/types/domain";

export function ImportForm({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [rawCount, setRawCount] = useState(0);
  const [parsed, setParsed] = useState<ParsedTransaction[]>([]);
  const [included, setIncluded] = useState<Set<number>>(new Set());
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleFile(file: File) {
    setError(null);
    const text = await file.text();
    const rows = parseCsv(text);
    setRawCount(rows.length);
    const txs = rowsToTransactions(rows);
    setParsed(txs);
    setIncluded(new Set(txs.map((_, i) => i)));
    setFileName(file.name);
    if (txs.length === 0) {
      setError(
        "Impossible de détecter des transactions. Colonnes attendues : date, libellé, montant (ou débit/crédit).",
      );
    }
  }

  function toggle(idx: number) {
    setIncluded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function handleSubmit() {
    if (!accountId) {
      setError("Choisis un compte.");
      return;
    }
    const transactions = parsed.filter((_, i) => included.has(i));
    if (transactions.length === 0) {
      setError("Aucune ligne sélectionnée.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await importTransactions({ accountId, transactions });
      if (result.ok) {
        router.push("/comptes");
      } else {
        setError(result.error);
      }
    });
  }

  const includedCount = included.size;
  const inflow = parsed.filter((_, i) => included.has(i) && parsed[i].kind === "in").reduce((a, t) => a + t.amount, 0);
  const outflow = parsed.filter((_, i) => included.has(i) && parsed[i].kind === "out").reduce((a, t) => a + t.amount, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1 · Choisis ton fichier CSV</CardTitle>
          <CardDescription>
            La plupart des banques suisses exportent un CSV compatible. Colonnes attendues : date,
            libellé/description, montant (ou débit/crédit séparés).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Compte de destination" required>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Fichier CSV">
              <label className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-input bg-background px-3 text-sm text-muted-foreground transition-colors hover:border-foreground/30">
                <Upload className="h-4 w-4" />
                <span>{fileName ?? "Choisir un fichier…"}</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleFile(f);
                  }}
                />
              </label>
            </FormField>
          </div>
          {rawCount > 0 ? (
            <p className="text-xs text-muted-foreground">
              {rawCount} ligne{rawCount > 1 ? "s" : ""} lue{rawCount > 1 ? "s" : ""} dans le CSV, {parsed.length}{" "}
              transaction{parsed.length > 1 ? "s" : ""} détectée{parsed.length > 1 ? "s" : ""}.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {parsed.length > 0 ? (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>2 · Vérifie et importe</CardTitle>
              <CardDescription>
                Décoche les lignes à exclure. Tu peux toujours les ajouter manuellement plus tard.
              </CardDescription>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <div>
                <span className="num font-medium text-foreground">{includedCount}</span> sélectionnée{includedCount > 1 ? "s" : ""}
              </div>
              <div className="mt-0.5">
                <span className="text-confirmed">+ <Money amount={inflow} /></span> ·{" "}
                <span className="text-danger">− <Money amount={outflow} /></span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Sens</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsed.map((t, idx) => {
                  const selected = included.has(idx);
                  return (
                    <TableRow key={idx} className={selected ? "" : "opacity-50"}>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => toggle(idx)}
                          className={`flex h-5 w-5 items-center justify-center rounded border ${
                            selected
                              ? "border-foreground bg-foreground text-background"
                              : "border-input"
                          }`}
                          aria-label={selected ? "Exclure" : "Inclure"}
                        >
                          {selected ? <Check className="h-3 w-3" /> : <X className="h-3 w-3 opacity-30" />}
                        </button>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(t.date)}</TableCell>
                      <TableCell>{t.label}</TableCell>
                      <TableCell>
                        <Badge variant={t.kind === "in" ? "confirmed" : "danger"}>
                          {t.kind === "in" ? "Entrée" : "Sortie"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Money
                          amount={t.kind === "in" ? t.amount : -t.amount}
                          tone="auto"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => router.back()} disabled={pending}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={pending || parsed.length === 0 || includedCount === 0}
        >
          {pending
            ? "Import…"
            : `Importer ${includedCount} transaction${includedCount > 1 ? "s" : ""}`}
        </Button>
      </div>
    </div>
  );
}
