"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
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
import { FormField } from "@/components/shared/form-field";
import { FormError } from "@/components/shared/form-error";
import { DialogFormFooter } from "@/components/shared/dialog-form-footer";
import { createContact, updateContact } from "@/app/actions/contacts";
import type { Contact } from "@/types/domain";

interface Props {
  /** When present, the dialog is in edit mode and prefills from this contact. */
  contact?: Contact;
  /** Pre-binds the contact to a given client (used from a client detail page). */
  clientId?: string;
  /** Custom trigger; defaults to a "+ Nouveau contact" button. */
  trigger?: React.ReactNode;
}

export function ContactDialog({ contact, clientId, trigger }: Props) {
  const router = useRouter();
  const isEdit = Boolean(contact);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      clientId: clientId ?? contact?.clientId ?? undefined,
      firstName: String(fd.get("firstName") ?? ""),
      lastName: String(fd.get("lastName") ?? ""),
      role: String(fd.get("role") ?? "") || undefined,
      email: String(fd.get("email") ?? "") || undefined,
      phone: String(fd.get("phone") ?? "") || undefined,
      notes: String(fd.get("notes") ?? "") || undefined,
    };
    startTransition(async () => {
      const result = isEdit
        ? await updateContact({ id: contact!.id, ...payload })
        : await createContact(payload);
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  const defaultTrigger = isEdit ? (
    <Button variant="ghost" size="icon" aria-label="Modifier le contact">
      <Pencil className="h-3.5 w-3.5" />
    </Button>
  ) : (
    <Button variant="outline" size="sm">
      <Plus className="h-4 w-4" />
      Nouveau contact
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le contact" : "Nouveau contact"}</DialogTitle>
          <DialogDescription>
            Un contact peut exister sans être lié à un client.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Prénom" required>
              <Input name="firstName" defaultValue={contact?.firstName ?? ""} required autoFocus />
            </FormField>
            <FormField label="Nom" required>
              <Input name="lastName" defaultValue={contact?.lastName ?? ""} required />
            </FormField>
          </div>
          <FormField label="Rôle" hint="ex. Directrice de création">
            <Input name="role" defaultValue={contact?.role ?? ""} />
          </FormField>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Email">
              <Input name="email" type="email" defaultValue={contact?.email ?? ""} />
            </FormField>
            <FormField label="Téléphone">
              <Input name="phone" defaultValue={contact?.phone ?? ""} />
            </FormField>
          </div>
          <FormField label="Notes">
            <Textarea name="notes" rows={2} defaultValue={contact?.notes ?? ""} />
          </FormField>

          <FormError message={error} size="xs" />

          <DialogFormFooter
            pending={pending}
            submitLabel={isEdit ? "Enregistrer" : "Créer le contact"}
            pendingLabel="Enregistrement…"
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
