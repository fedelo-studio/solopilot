"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import { FormError } from "@/components/shared/form-error";
import { DialogFormFooter } from "@/components/shared/dialog-form-footer";
import { createDeal } from "@/app/actions/deals";
import { DEAL_STAGES, DEAL_STAGE_LABELS, type Client, type DealStage } from "@/types/domain";
import { DEFAULT_PROBABILITY } from "@/lib/finance/deals";

interface NewDealDialogProps {
  clients: Client[];
}

export function NewDealDialog({ clients }: NewDealDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<DealStage>("lead");
  const [clientId, setClientId] = useState<string>("");
  const [probability, setProbability] = useState<number>(DEFAULT_PROBABILITY.lead);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleStageChange(next: DealStage) {
    setStage(next);
    setProbability(DEFAULT_PROBABILITY[next]);
  }

  async function handleSubmit(formData: FormData) {
    setErrors({});
    setGlobalError(null);
    formData.set("stage", stage);
    formData.set("probability", String(probability));
    if (clientId) formData.set("clientId", clientId);

    startTransition(async () => {
      const result = await createDeal(formData);
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setErrors(result.fields ?? {});
        setGlobalError(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Nouveau deal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau deal</DialogTitle>
          <DialogDescription>
            Un deal peut exister sans client — utile pour un prospect direct.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <FormField label="Titre" htmlFor="title" required error={errors.title}>
            <Input id="title" name="title" placeholder="Refonte branding — Studio Lumen" required autoFocus />
          </FormField>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Client" hint="Optionnel">
              <Select value={clientId || "none"} onValueChange={(v) => setClientId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Aucun" />
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
            <FormField label="Montant estimé (CHF)" htmlFor="estimatedAmount" required error={errors.estimatedAmount}>
              <Input
                id="estimatedAmount"
                name="estimatedAmount"
                type="number"
                inputMode="decimal"
                min={0}
                step={100}
                placeholder="12000"
                required
              />
            </FormField>
            <FormField label={`Probabilité (${probability}%)`} hint="Ajustable par étape">
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
            <FormField label="Signature attendue" htmlFor="expectedSignatureDate">
              <Input id="expectedSignatureDate" name="expectedSignatureDate" type="date" />
            </FormField>
            <FormField label="Paiement attendu" htmlFor="expectedPaymentDate">
              <Input id="expectedPaymentDate" name="expectedPaymentDate" type="date" />
            </FormField>
          </div>

          <FormField label="Notes" htmlFor="notes">
            <Textarea id="notes" name="notes" rows={3} placeholder="Contexte du deal, prochaines étapes…" />
          </FormField>

          <FormError message={globalError} size="xs" />

          <DialogFormFooter
            pending={pending}
            submitLabel="Créer le deal"
            pendingLabel="Création…"
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
