"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormField } from "@/components/shared/form-field";
import { updateCompanySettings } from "@/app/actions/company";
import type { CompanySettings } from "@/types/domain";

export function SettingsForm({ initial }: { initial: CompanySettings }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(formData: FormData) {
    setErrors({});
    setMessage(null);
    startTransition(async () => {
      const result = await updateCompanySettings(formData);
      if (result.ok) {
        setMessage({ kind: "ok", text: "Paramètres enregistrés." });
        setTimeout(() => setMessage(null), 4000);
      } else {
        setErrors(result.fields ?? {});
        setMessage({ kind: "error", text: result.error });
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identité</CardTitle>
          <CardDescription>
            Apparaît sur les factures et dans l&apos;interface.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField label="Nom de l'entreprise" htmlFor="companyName" required error={errors.companyName}>
            <Input
              id="companyName"
              name="companyName"
              defaultValue={initial.companyName}
              required
            />
          </FormField>
          <FormField label="Nom du propriétaire" htmlFor="ownerName" required error={errors.ownerName}>
            <Input
              id="ownerName"
              name="ownerName"
              defaultValue={initial.ownerName}
              required
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paramètres financiers</CardTitle>
          <CardDescription>
            Le taux de TVA et le pourcentage de réserve sont des hypothèses produit — à valider
            avec un comptable selon ton régime fiscal.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Taux de TVA par défaut (%)"
            htmlFor="defaultVatRate"
            required
            hint="Appliqué aux nouvelles lignes de facture. Modifiable par ligne."
            error={errors.defaultVatRate}
          >
            <Input
              id="defaultVatRate"
              name="defaultVatRate"
              type="number"
              step="0.1"
              min={0}
              max={100}
              defaultValue={initial.defaultVatRate}
              required
            />
          </FormField>
          <FormField
            label="Réserve mensuelle (%)"
            htmlFor="reservePercent"
            required
            hint="% du CA à mettre de côté pour impôts, AVS, etc."
            error={errors.reservePercent}
          >
            <Input
              id="reservePercent"
              name="reservePercent"
              type="number"
              step="1"
              min={0}
              max={100}
              defaultValue={initial.reservePercent}
              required
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coordonnées bancaires & légales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="IBAN" htmlFor="iban" hint="Apparaît sur la facture PDF.">
            <Input id="iban" name="iban" defaultValue={initial.iban ?? ""} placeholder="CH00 0000 0000 0000 0000 0" />
          </FormField>
          <FormField
            label="Pied de page facture"
            htmlFor="invoiceFooter"
            hint="Conditions de paiement, mentions légales, etc."
          >
            <Textarea
              id="invoiceFooter"
              name="invoiceFooter"
              defaultValue={initial.invoiceFooter ?? ""}
              rows={3}
            />
          </FormField>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {message ? (
          <span
            className={`text-xs ${
              message.kind === "ok" ? "text-confirmed" : "text-danger"
            }`}
          >
            {message.text}
          </span>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
