"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import { cn } from "@/lib/utils";

import { updateCompanySettings } from "@/app/actions/company";
import { createAccount } from "@/app/actions/accounts";
import { createClient as createClientAction } from "@/app/actions/clients";
import type { CompanySettings } from "@/types/domain";

const STEPS = ["Entreprise", "Compte bancaire", "Premier client"] as const;
type StepIndex = 0 | 1 | 2;

export function OnboardingWizard({ initial }: { initial: CompanySettings }) {
  const router = useRouter();
  const [step, setStep] = useState<StepIndex>(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Step 1 — company
  const [companyName, setCompanyName] = useState(
    initial.companyName === "Mon studio" ? "" : initial.companyName,
  );
  const [ownerName, setOwnerName] = useState(initial.ownerName);
  const [vatRate, setVatRate] = useState(initial.defaultVatRate);
  const [reservePercent, setReservePercent] = useState(initial.reservePercent);

  // Step 2 — first account
  const [accountName, setAccountName] = useState("Compte courant principal");
  const [accountKind, setAccountKind] = useState<"bank" | "cash" | "savings">("bank");
  const [initialBalance, setInitialBalance] = useState<number>(0);

  // Step 3 — first client
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  async function handleCompanySubmit() {
    setError(null);
    const fd = new FormData();
    fd.set("companyName", companyName);
    fd.set("ownerName", ownerName);
    fd.set("defaultVatRate", String(vatRate));
    fd.set("reservePercent", String(reservePercent));
    fd.set("iban", initial.iban ?? "");
    fd.set("invoiceFooter", initial.invoiceFooter ?? "");

    startTransition(async () => {
      const result = await updateCompanySettings(fd);
      if (result.ok) setStep(1);
      else setError(result.error);
    });
  }

  async function handleAccountSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await createAccount({
        name: accountName,
        kind: accountKind,
        initialBalance,
      });
      if (result.ok) setStep(2);
      else setError(result.error);
    });
  }

  async function handleClientSubmit() {
    setError(null);
    if (!clientName.trim()) {
      // Allow skipping — go straight to dashboard.
      router.push("/dashboard");
      return;
    }
    const fd = new FormData();
    fd.set("name", clientName);
    fd.set("kind", "company");
    fd.set("status", "prospect");
    if (clientEmail) fd.set("email", clientEmail);

    startTransition(async () => {
      const result = await createClientAction(fd);
      if (result.ok) router.push("/dashboard");
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <ol className="flex items-center gap-2 text-sm">
        {STEPS.map((label, idx) => {
          const isDone = idx < step;
          const isCurrent = idx === step;
          return (
            <li key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                  isDone
                    ? "bg-confirmed text-confirmed-foreground"
                    : isCurrent
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {isDone ? <Check className="h-3 w-3" /> : idx + 1}
              </div>
              <span
                className={cn(
                  "text-xs",
                  isCurrent ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
              {idx < STEPS.length - 1 ? (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              ) : null}
            </li>
          );
        })}
      </ol>

      {/* Step 1 */}
      {step === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Ton entreprise</CardTitle>
            <CardDescription>
              Ces infos apparaîtront sur tes factures et dans l'interface. Tu pourras tout changer
              plus tard dans les Paramètres.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Nom de l'entreprise" required>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Fedelo Studio"
                  required
                  autoFocus
                />
              </FormField>
              <FormField label="Ton nom" required>
                <Input
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  required
                />
              </FormField>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="TVA par défaut (%)"
                hint="Appliquée aux nouvelles factures. À valider avec ton comptable."
              >
                <Input
                  type="number"
                  step="0.1"
                  min={0}
                  max={100}
                  value={vatRate}
                  onChange={(e) => setVatRate(Number(e.target.value))}
                />
              </FormField>
              <FormField label="Réserve mensuelle (%)" hint="% du CA à mettre de côté pour les charges.">
                <Input
                  type="number"
                  step="1"
                  min={0}
                  max={100}
                  value={reservePercent}
                  onChange={(e) => setReservePercent(Number(e.target.value))}
                />
              </FormField>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                Passer
              </Button>
              <Button onClick={handleCompanySubmit} disabled={pending || !companyName.trim()}>
                {pending ? "…" : "Continuer"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Step 2 */}
      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>Premier compte</CardTitle>
            <CardDescription>
              Ajoute un compte bancaire ou un espèces pour qu'on puisse calculer ton cash réel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Nom du compte" required>
              <Input
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Compte courant — PostFinance"
                required
                autoFocus
              />
            </FormField>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Type">
                <Select value={accountKind} onValueChange={(v) => setAccountKind(v as typeof accountKind)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Compte bancaire</SelectItem>
                    <SelectItem value="cash">Espèces</SelectItem>
                    <SelectItem value="savings">Épargne / réserve</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Solde actuel (CHF)" hint="Approximatif, ajustable plus tard.">
                <Input
                  type="number"
                  step="0.05"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(Number(e.target.value))}
                />
              </FormField>
            </div>
            <div className="flex justify-between gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep(0)}>
                Retour
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  Sauter
                </Button>
                <Button onClick={handleAccountSubmit} disabled={pending || !accountName.trim()}>
                  {pending ? "…" : "Continuer"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Step 3 */}
      {step === 2 ? (
        <Card>
          <CardHeader>
            <CardTitle>Premier client (optionnel)</CardTitle>
            <CardDescription>
              Tu pourras toujours en ajouter un plus tard depuis la page Clients.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Nom du client">
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Studio Lumen, Acme Inc., etc."
                autoFocus
              />
            </FormField>
            <FormField label="Email" hint="Optionnel">
              <Input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="contact@studio-lumen.ch"
              />
            </FormField>
            <div className="flex justify-between gap-2 pt-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Retour
              </Button>
              <Button onClick={handleClientSubmit} disabled={pending}>
                {pending ? "…" : clientName.trim() ? "Créer et terminer" : "Terminer"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
