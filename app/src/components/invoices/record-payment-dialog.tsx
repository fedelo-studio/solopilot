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
import { Money } from "@/components/shared/money";
import { recordPayment } from "@/app/actions/invoices";
import {
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/types/domain";

interface Props {
  invoiceId: string;
  defaultAmount: number;
  /** Disable the button when the invoice is already fully paid. */
  disabled?: boolean;
}

export function RecordPaymentDialog({ invoiceId, defaultAmount, disabled }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [method, setMethod] = useState<PaymentMethod>("bank_transfer");
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [paidOn, setPaidOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await recordPayment({
        invoiceId,
        amount,
        paidOn,
        method,
        notes: notes || undefined,
      });
      if (result.ok) {
        setOpen(false);
        // Reset for next opening.
        setNotes("");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <Plus className="h-4 w-4" />
          Enregistrer un paiement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau paiement</DialogTitle>
          <DialogDescription>
            Le solde et le statut de la facture seront mis à jour automatiquement.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Date" required>
              <Input
                type="date"
                value={paidOn}
                onChange={(e) => setPaidOn(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Montant (CHF)" required hint={`Solde dû : ${defaultAmount.toFixed(2)}`}>
              <Input
                type="number"
                min={0.01}
                step="0.05"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
              />
            </FormField>
          </div>

          <FormField label="Méthode de paiement">
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                  <SelectItem key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Notes">
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Référence virement, contexte…"
            />
          </FormField>

          {amount > defaultAmount ? (
            <p className="text-xs text-warning">
              Attention : le montant dépasse le solde dû ({" "}
              <Money amount={defaultAmount} className="text-xs" />
              ).
            </p>
          ) : null}

          <FormError message={error} size="xs" />

          <DialogFormFooter
            pending={pending}
            submitLabel="Enregistrer"
            pendingLabel="Enregistrement…"
            disableSubmit={amount <= 0}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
