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
import { updateClient } from "@/app/actions/clients";
import type { Client } from "@/types/domain";

export function EditClientForm({ client }: { client: Client }) {
  const router = useRouter();
  const [kind, setKind] = useState<Client["kind"]>(client.kind);
  const [status, setStatus] = useState<Client["status"]>(client.status);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setErrors({});
    setGlobalError(null);
    formData.set("id", client.id);
    formData.set("kind", kind);
    formData.set("status", status);

    startTransition(async () => {
      const result = await updateClient(formData);
      if (result.ok) {
        router.push(`/clients/${client.id}`);
      } else {
        setErrors(result.fields ?? {});
        setGlobalError(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identité</CardTitle>
          <CardDescription>Visible sur les factures et dans le pipeline.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Nom" required error={errors.name}>
            <Input name="name" defaultValue={client.name} required autoFocus />
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Email" error={errors.email}>
              <Input name="email" type="email" defaultValue={client.email ?? ""} />
            </FormField>
            <FormField label="Téléphone">
              <Input name="phone" defaultValue={client.phone ?? ""} />
            </FormField>
          </div>
          <FormField label="Adresse">
            <Input name="address" defaultValue={client.address ?? ""} />
          </FormField>
          <FormField label="N° TVA">
            <Input name="vatNumber" defaultValue={client.vatNumber ?? ""} placeholder="CHE-123.456.789 TVA" />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea name="notes" defaultValue={client.notes ?? ""} rows={3} />
        </CardContent>
      </Card>

      <FormError message={globalError} />

      <FormActions pending={pending} />
    </form>
  );
}
