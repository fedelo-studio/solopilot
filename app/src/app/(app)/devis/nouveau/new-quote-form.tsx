"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import { FormActions } from "@/components/shared/form-actions";
import { FormError } from "@/components/shared/form-error";
import { Money } from "@/components/shared/money";
import { TotalsRow } from "@/components/shared/totals-row";
import { LineItemsHeader } from "@/components/shared/line-items-header";
import { Separator } from "@/components/ui/separator";
import type { Client } from "@/types/domain";
import { createQuote } from "@/app/actions/quotes";
import { computeLineTotals, lineTotalExclVat } from "@/lib/finance/lines";

interface Props {
  clients: Client[];
  defaultNumber: string;
  defaultVatRate: number;
}

interface LineDraft {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

function newLine(defaultVatRate: number): LineDraft {
  return {
    id: crypto.randomUUID(),
    description: "",
    quantity: 1,
    unitPrice: 0,
    vatRate: defaultVatRate,
  };
}

export function NewQuoteForm({ clients, defaultNumber, defaultVatRate }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [clientId, setClientId] = useState("");
  const [status, setStatus] = useState<"draft" | "sent">("draft");
  const [number, setNumber] = useState(defaultNumber);
  const [issuedAt] = useState(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([newLine(defaultVatRate)]);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => computeLineTotals(lines), [lines]);

  function updateLine(id: string, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function removeLine(id: string) {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!clientId) {
      setError("Sélectionne un client.");
      return;
    }
    startTransition(async () => {
      const result = await createQuote({
        clientId,
        number: number || undefined,
        validUntil: validUntil || undefined,
        status,
        notes: notes || undefined,
        lines: lines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          vatRate: l.vatRate,
        })),
      });
      if (result.ok) router.push("/devis");
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
          <CardDescription>Numéro auto-incrémenté, modifiable.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <FormField label="Numéro">
            <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder={defaultNumber} />
          </FormField>
          <FormField label="Émis le">
            <Input type="date" value={issuedAt} readOnly className="cursor-not-allowed bg-muted/30" />
          </FormField>
          <FormField label="Valide jusqu'au">
            <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          </FormField>

          <FormField label="Client" required>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Statut initial">
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="sent">Envoyé</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Lignes</CardTitle>
            <CardDescription>Une ligne = une prestation. TVA configurable.</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLines((prev) => [...prev, newLine(defaultVatRate)])}
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <LineItemsHeader />
          {lines.map((line) => {
            const lineTotal = lineTotalExclVat(line);
            return (
              <div
                key={line.id}
                className="grid gap-3 rounded-md border border-border bg-card p-3 md:grid-cols-[1fr_80px_120px_80px_120px_36px]"
              >
                <Input
                  placeholder="Description"
                  aria-label="Description"
                  value={line.description}
                  onChange={(e) => updateLine(line.id, { description: e.target.value })}
                  required
                />
                <Input
                  type="number"
                  min={0}
                  step="0.25"
                  aria-label="Quantité"
                  value={line.quantity}
                  onChange={(e) => updateLine(line.id, { quantity: Number(e.target.value) })}
                  className="text-right"
                />
                <Input
                  type="number"
                  min={0}
                  step="0.05"
                  aria-label="Prix unitaire"
                  value={line.unitPrice}
                  onChange={(e) => updateLine(line.id, { unitPrice: Number(e.target.value) })}
                  className="text-right"
                />
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  aria-label="TVA en pourcent"
                  value={line.vatRate}
                  onChange={(e) => updateLine(line.id, { vatRate: Number(e.target.value) })}
                  className="text-right"
                />
                <div className="flex items-center justify-end text-sm" aria-label="Total hors taxes">
                  <Money amount={lineTotal} />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLine(line.id)}
                  disabled={lines.length <= 1}
                  aria-label="Supprimer la ligne"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            );
          })}

          <Separator />
          <div className="ml-auto w-full max-w-xs space-y-1 text-sm">
            <TotalsRow label="Sous-total" value={totals.subtotal} />
            <TotalsRow label="TVA" value={totals.vatAmount} />
            <div className="border-t border-border pt-2">
              <TotalsRow label="Total TTC" value={totals.total} bold />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
          <CardDescription>Apparaîtront en bas du devis imprimé.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Conditions, périmètre, exclusions…"
          />
        </CardContent>
      </Card>

      <FormError message={error} />

      <FormActions pending={pending} submitLabel="Créer le devis" pendingLabel="Création…" />
    </form>
  );
}
