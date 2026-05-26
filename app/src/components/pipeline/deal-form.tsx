"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { updateDeal } from "@/app/actions/deals";
import { DEAL_STAGES, DEAL_STAGE_LABELS, type Client, type Deal, type DealStage } from "@/types/domain";
import { DEFAULT_PROBABILITY } from "@/lib/finance/deals";

interface Props {
  deal: Deal;
  clients: Client[];
}

export function DealEditForm({ deal, clients }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [stage, setStage] = useState<DealStage>(deal.stage);
  const [clientId, setClientId] = useState<string>(deal.clientId ?? "");
  const [probability, setProbability] = useState<number>(deal.probability);
  const [error, setError] = useState<string | null>(null);

  function handleStageChange(next: DealStage) {
    setStage(next);
    setProbability(DEFAULT_PROBABILITY[next]);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateDeal({
        id: deal.id,
        title: String(fd.get("title") ?? ""),
        clientId: clientId || undefined,
        stage,
        estimatedAmount: Number(fd.get("estimatedAmount") ?? 0),
        probability,
        expectedSignatureDate: String(fd.get("expectedSignatureDate") ?? "") || undefined,
        expectedPaymentDate: String(fd.get("expectedPaymentDate") ?? "") || undefined,
        source: String(fd.get("source") ?? "") || undefined,
        notes: String(fd.get("notes") ?? "") || undefined,
      });
      if (result.ok) router.push(`/pipeline/${deal.id}`);
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Deal</CardTitle>
          <CardDescription>Modifie l'opportunité et son contexte.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Titre" required>
            <Input name="title" defaultValue={deal.title} required autoFocus />
          </FormField>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Client" hint="Optionnel pour un prospect direct">
              <Select value={clientId || "none"} onValueChange={(v) => setClientId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun (prospect direct)</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Étape">
              <Select value={stage} onValueChange={(v) => handleStageChange(v as DealStage)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {DEAL_STAGE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Montant estimé (CHF)" required>
              <Input
                name="estimatedAmount"
                type="number"
                min={0}
                step={100}
                defaultValue={deal.estimatedAmount}
                required
              />
            </FormField>
            <FormField label={`Probabilité (${probability}%)`}>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={probability}
                onChange={(e) => setProbability(Number(e.target.value))}
                className="w-full accent-foreground"
              />
            </FormField>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Signature attendue">
              <Input
                name="expectedSignatureDate"
                type="date"
                defaultValue={deal.expectedSignatureDate ?? ""}
              />
            </FormField>
            <FormField label="Paiement attendu">
              <Input
                name="expectedPaymentDate"
                type="date"
                defaultValue={deal.expectedPaymentDate ?? ""}
              />
            </FormField>
          </div>

          <FormField label="Source" hint="LinkedIn, recommandation, etc.">
            <Input name="source" defaultValue={deal.source ?? ""} />
          </FormField>

          <FormField label="Notes">
            <Textarea name="notes" defaultValue={deal.notes ?? ""} rows={3} />
          </FormField>
        </CardContent>
      </Card>

      <FormError message={error} />

      <FormActions pending={pending} />
    </form>
  );
}
