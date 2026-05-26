"use client";

import { useState, useTransition } from "react";
import { Send, ThumbsUp, ThumbsDown, FileText, Hourglass } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { DialogFormFooter } from "@/components/shared/dialog-form-footer";
import { setQuoteStatus, convertQuoteToInvoice } from "@/app/actions/quotes";
import type { QuoteStatus } from "@/types/domain";
import { useRouter } from "next/navigation";

interface Props {
  quoteId: string;
  status: QuoteStatus;
  /** Already converted to invoice? Disables the convert action. */
  alreadyConverted: boolean;
}

export function QuoteActions({ quoteId, status, alreadyConverted }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [convertOpen, setConvertOpen] = useState(false);
  const [dueInDays, setDueInDays] = useState(30);

  function transition(action: () => Promise<{ ok: boolean; error?: string }>) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) router.refresh();
      else setMessage(result.error ?? "Erreur");
    });
  }

  function handleConvert() {
    setMessage(null);
    startTransition(async () => {
      const result = await convertQuoteToInvoice({ quoteId, dueInDays });
      if (result.ok && "invoiceId" in result.data) {
        router.push(`/factures/${result.data.invoiceId}`);
      } else if (!result.ok) {
        setMessage(result.error);
      }
    });
  }

  const canMarkSent = status === "draft";
  const canAccept = status === "sent" || status === "expired";
  const canDecline = status === "sent" || status === "expired";
  const canConvert = status === "accepted" && !alreadyConverted;
  const canMarkExpired = status === "sent";

  return (
    <div className="space-y-2">
      {canMarkSent ? (
        <Button
          variant="outline"
          className="w-full justify-start"
          disabled={pending}
          onClick={() => transition(() => setQuoteStatus({ quoteId, status: "sent" }))}
        >
          <Send className="h-4 w-4" />
          Marquer comme envoyé
        </Button>
      ) : null}

      {canAccept ? (
        <Button
          className="w-full justify-start"
          disabled={pending}
          onClick={() => transition(() => setQuoteStatus({ quoteId, status: "accepted" }))}
        >
          <ThumbsUp className="h-4 w-4" />
          Marquer accepté
        </Button>
      ) : null}

      {canDecline ? (
        <Button
          variant="outline"
          className="w-full justify-start text-danger hover:bg-danger-soft hover:text-danger"
          disabled={pending}
          onClick={() => {
            if (!confirm("Marquer ce devis comme refusé ?")) return;
            transition(() => setQuoteStatus({ quoteId, status: "declined" }));
          }}
        >
          <ThumbsDown className="h-4 w-4" />
          Marquer refusé
        </Button>
      ) : null}

      {canMarkExpired ? (
        <Button
          variant="outline"
          className="w-full justify-start text-muted-foreground"
          disabled={pending}
          onClick={() => transition(() => setQuoteStatus({ quoteId, status: "expired" }))}
        >
          <Hourglass className="h-4 w-4" />
          Marquer expiré
        </Button>
      ) : null}

      {canConvert ? (
        <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
          <DialogTrigger asChild>
            <Button variant="hot" className="w-full justify-start">
              <FileText className="h-4 w-4" />
              Convertir en facture
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convertir en facture</DialogTitle>
              <DialogDescription>
                Une nouvelle facture sera créée avec les mêmes lignes. Le devis sera marqué accepté et lié à la facture.
              </DialogDescription>
            </DialogHeader>
            <FormField label="Échéance de la facture (jours)" hint="Délai de paiement standard : 30 jours.">
              <Input
                type="number"
                min={0}
                max={120}
                value={dueInDays}
                onChange={(e) => setDueInDays(Number(e.target.value))}
              />
            </FormField>
            <DialogFormFooter
              pending={pending}
              submitLabel="Créer la facture"
              pendingLabel="Conversion…"
              submitVariant="hot"
              onSubmit={handleConvert}
            />
          </DialogContent>
        </Dialog>
      ) : null}

      {alreadyConverted ? (
        <p className="rounded-md border border-confirmed/40 bg-confirmed-soft px-3 py-2 text-xs text-confirmed">
          Devis converti en facture ✓
        </p>
      ) : null}

      {message ? <p className="text-xs text-danger">{message}</p> : null}
    </div>
  );
}
