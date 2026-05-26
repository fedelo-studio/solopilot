"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Ban, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setInvoiceStatus, sendReminder } from "@/app/actions/invoices";
import type { InvoiceStatus } from "@/types/domain";

interface Props {
  invoiceId: string;
  status: InvoiceStatus;
  /** Live-derived: overdue if past due date and not paid. */
  isOverdue: boolean;
  /** Already fully paid via payments — disables mark-as-paid override. */
  fullyPaid: boolean;
}

export function InvoiceActions({ invoiceId, status, isOverdue, fullyPaid }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function transition(action: () => Promise<{ ok: boolean; error?: string }>) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) router.refresh();
      else setMessage(result.error ?? "Erreur");
    });
  }

  // What actions are available depends on the status.
  const canMarkSent = status === "draft";
  const canMarkCancelled = status !== "cancelled" && status !== "paid";
  const canRemind = (status === "sent" || isOverdue) && !fullyPaid;
  const canForcePaid = !fullyPaid && status !== "paid" && status !== "draft" && status !== "cancelled";

  return (
    <div className="space-y-2">
      {canMarkSent ? (
        <Button
          variant="outline"
          className="w-full justify-start"
          disabled={pending}
          onClick={() => transition(() => setInvoiceStatus({ invoiceId, status: "sent" }))}
        >
          <Send className="h-4 w-4" />
          Marquer comme envoyée
        </Button>
      ) : null}

      {canRemind ? (
        <Button
          variant="outline"
          className="w-full justify-start"
          disabled={pending}
          onClick={() => transition(() => sendReminder(invoiceId))}
        >
          <Mail className="h-4 w-4" />
          Enregistrer une relance
        </Button>
      ) : null}

      {canForcePaid ? (
        <Button
          variant="outline"
          className="w-full justify-start"
          disabled={pending}
          onClick={() => transition(() => setInvoiceStatus({ invoiceId, status: "paid" }))}
        >
          <CheckCircle2 className="h-4 w-4" />
          Forcer le statut payé
        </Button>
      ) : null}

      {canMarkCancelled ? (
        <Button
          variant="outline"
          className="w-full justify-start text-danger hover:bg-danger-soft hover:text-danger"
          disabled={pending}
          onClick={() => {
            if (!confirm("Marquer cette facture comme annulée ?")) return;
            transition(() => setInvoiceStatus({ invoiceId, status: "cancelled" }));
          }}
        >
          <Ban className="h-4 w-4" />
          Annuler la facture
        </Button>
      ) : null}

      {message ? <p className="text-xs text-danger">{message}</p> : null}
    </div>
  );
}
