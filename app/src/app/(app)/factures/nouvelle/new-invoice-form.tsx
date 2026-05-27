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
import type { Client, Project } from "@/types/domain";
import { createInvoice } from "@/app/actions/invoices";
import { computeLineTotals, lineTotalExclVat } from "@/lib/finance/lines";

interface NewInvoiceFormProps {
  clients: Client[];
  projects: Project[];
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

export function NewInvoiceForm({ clients, projects, defaultNumber, defaultVatRate }: NewInvoiceFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState<"draft" | "sent">("draft");
  const [number, setNumber] = useState(defaultNumber);
  const [issuedAt] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([newLine(defaultVatRate)]);
  const [error, setError] = useState<string | null>(null);

  const filteredProjects = useMemo(
    () => projects.filter((p) => !clientId || p.clientId === clientId),
    [projects, clientId],
  );

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
    if (lines.length === 0) {
      setError("Ajoute au moins une ligne.");
      return;
    }

    startTransition(async () => {
      const result = await createInvoice({
        clientId,
        projectId: projectId || undefined,
        number: number || undefined,
        dueDate,
        status,
        notes: notes || undefined,
        lines: lines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          vatRate: l.vatRate,
        })),
      });
      if (result.ok) {
        router.push("/factures");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header / meta */}
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
          <CardDescription>Le numéro est généré automatiquement, tu peux le modifier.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <FormField label="Numéro">
            <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder={defaultNumber} />
          </FormField>
          <FormField label="Émise le">
            <Input type="date" value={issuedAt} readOnly className="cursor-not-allowed bg-muted/30" />
          </FormField>
          <FormField label="Échéance" required>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
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

          <FormField label="Projet" hint="Optionnel — liera la facture au projet">
            <Select value={projectId || "none"} onValueChange={(v) => setProjectId(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Aucun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun</SelectItem>
                {filteredProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
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
                <SelectItem value="sent">Envoyée</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </CardContent>
      </Card>

      {/* Lines */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Lignes</CardTitle>
            <CardDescription>Une ligne = une prestation. TVA configurable par ligne.</CardDescription>
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
                  placeholder="Description (ex. Refonte branding — acompte)"
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
                  placeholder="0.00"
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
                  placeholder="%"
                />
                <div className="flex items-center justify-end text-sm" aria-label="Total hors taxes">
                  <Money amount={lineTotal} />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLine(line.id)}
                  aria-label="Supprimer la ligne"
                  disabled={lines.length <= 1}
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

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
          <CardDescription>Apparaîtront en bas de la facture imprimée.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Conditions de paiement, IBAN, etc." />
        </CardContent>
      </Card>

      <FormError message={error} />

      <FormActions pending={pending} submitLabel="Créer la facture" pendingLabel="Création…" />

      <p className="text-xs text-muted-foreground">
        Hypothèse produit : la TVA est saisie par ligne et n&apos;est ni vérifiée ni déclarée
        automatiquement. À valider avec un comptable selon ton régime fiscal.
      </p>
    </form>
  );
}
