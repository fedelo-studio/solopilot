"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { FormActions } from "@/components/shared/form-actions";
import { FormError } from "@/components/shared/form-error";
import { createAccount, updateAccount } from "@/app/actions/accounts";
import type { Account } from "@/types/domain";

interface Props {
  account?: Account;
}

export function AccountForm({ account }: Props) {
  const router = useRouter();
  const isEdit = Boolean(account);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(account?.name ?? "");
  const [kind, setKind] = useState<Account["kind"]>(account?.kind ?? "bank");
  const [initialBalance, setInitialBalance] = useState(account?.initialBalance ?? 0);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const payload = { name, kind, initialBalance };
      const result = isEdit
        ? await updateAccount({ id: account!.id, ...payload })
        : await createAccount(payload);
      if (result.ok) router.push("/comptes");
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Compte</CardTitle>
          <CardDescription>
            Le solde initial est ton point de départ. Les transactions s'ajoutent par-dessus.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Nom" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Compte courant — PostFinance"
              required
              autoFocus
            />
          </FormField>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Type">
              <Select value={kind} onValueChange={(v) => setKind(v as Account["kind"])}>
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
            <FormField label="Solde initial (CHF)" hint="Approximatif, ajustable plus tard.">
              <Input
                type="number"
                step="0.05"
                value={initialBalance}
                onChange={(e) => setInitialBalance(Number(e.target.value))}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <FormError message={error} />

      <FormActions
        pending={pending}
        submitLabel={isEdit ? "Enregistrer" : "Créer le compte"}
      />
    </form>
  );
}
