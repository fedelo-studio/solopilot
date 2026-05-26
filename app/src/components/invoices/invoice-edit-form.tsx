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
import type { Client, Invoice, Project } from "@/types/domain";
import { updateInvoice } from "@/app/actions/invoices";
import { computeLineTotals, lineTotalExclVat } from "@/lib/finance/lines";

interface Props {
  invoice: Invoice;
  clients: Client[];
  projects: Project[];
}

interface LineDraft {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

export function InvoiceEditForm({ invoice, clients, projects }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [clientId, setClientId] = useState(invoice.clientId);
  const [projectId, setProjectId] = useState(invoice.projectId ?? "");
  const [status, setStatus] = useState<"draft" | "sent">(
    invoice.status === "sent" ? "sent" : "draft",
  );
  const [dueDate, setDueDate] = useState(invoice.dueDate);
  const [notes, setNotes] = useState(invoice.notes ?? "");
  const [lines, setLines] = useState<LineDraft[]>(
    invoice.lines.map((l) => ({
      id: l.id,
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      vatRate: l.vatRate,
    })),
  );
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
  function addLine() {
    setLines((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0, vatRate: 8.1 },
    ]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateInvoice({
        id: invoice.id,
        clientId,
        projectId: projectId || undefined,
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
      if (result.ok) router.push(`/factures/${invoice.id}`);
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
          <CardDescription>
            Le numéro de facture ne peut pas être modifié après création.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <FormField label="Numéro">
            <Input value={invoice.number} readOnly className="cursor-not-allowed bg-muted/30" />
          </FormField>
          <FormField label="Émise le">
            <Input value={invoice.issuedAt} readOnly className="cursor-not-allowed bg-muted/30" />
          </FormField>
          <FormField label="Échéance" required>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </FormField>

          <FormField label="Client" required>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue />
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

          <FormField label="Projet">
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

          <FormField label="Statut">
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Lignes</CardTitle>
            <CardDescription>Les paiements existants seront recalculés automatiquement.</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addLine}>
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <LineItemsHeader />
          {lines.map((line) => (
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
                <Money amount={lineTotalExclVat(line)} />
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
          ))}

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
        </CardHeader>
        <CardContent>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </CardContent>
      </Card>

      <FormError message={error} />

      <FormActions pending={pending} />
    </form>
  );
}
