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
import { createClient } from "@/app/actions/clients";

export function NewClientDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"company" | "individual">("company");
  const [status, setStatus] = useState<"prospect" | "active" | "archived">("prospect");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setErrors({});
    setGlobalError(null);
    // Inject the controlled select values into the formData.
    formData.set("kind", kind);
    formData.set("status", status);

    startTransition(async () => {
      const result = await createClient(formData);
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
          Nouveau client
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau client</DialogTitle>
          <DialogDescription>
            Un prospect devient un client dès qu&apos;un deal est gagné.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <FormField label="Nom" htmlFor="name" required error={errors.name}>
            <Input id="name" name="name" placeholder="Studio Lumen" required autoFocus />
          </FormField>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Type">
              <Select value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Entreprise</SelectItem>
                  <SelectItem value="individual">Particulier</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Statut">
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Email" htmlFor="email" error={errors.email}>
              <Input id="email" name="email" type="email" placeholder="contact@studio.ch" />
            </FormField>
            <FormField label="Téléphone" htmlFor="phone">
              <Input id="phone" name="phone" placeholder="+41 22 555 00 00" />
            </FormField>
          </div>

          <FormField label="Adresse" htmlFor="address">
            <Input id="address" name="address" placeholder="Rue du Rhône 12, 1204 Genève" />
          </FormField>

          <FormField label="N° TVA" htmlFor="vatNumber" hint="Optionnel — utilisé sur les factures.">
            <Input id="vatNumber" name="vatNumber" placeholder="CHE-123.456.789 TVA" />
          </FormField>

          <FormField label="Notes" htmlFor="notes">
            <Textarea id="notes" name="notes" rows={3} placeholder="Contexte, points clés…" />
          </FormField>

          <FormError message={globalError} size="xs" />

          <DialogFormFooter
            pending={pending}
            submitLabel="Créer le client"
            pendingLabel="Création…"
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
