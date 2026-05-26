"use client";

import { useMemo, useState, useTransition } from "react";
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
import { updateExpense } from "@/app/actions/expenses";
import type {
  Client,
  Deal,
  Expense,
  ExpenseCategory,
  ExpenseLink,
  Project,
} from "@/types/domain";

interface Props {
  expense: Expense;
  categories: ExpenseCategory[];
  clients: Client[];
  projects: Project[];
  deals: Deal[];
}

export function ExpenseEditForm({ expense, categories, clients, projects, deals }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [categoryId, setCategoryId] = useState(expense.categoryId ?? "");
  const [linkType, setLinkType] = useState<ExpenseLink["type"]>(expense.link.type);
  const [linkId, setLinkId] = useState(
    expense.link.type !== "none" ? expense.link.id : "",
  );
  const [billable, setBillable] = useState(expense.billable);
  const [error, setError] = useState<string | null>(null);

  const linkOptions = useMemo(() => {
    if (linkType === "client") return clients.map((c) => ({ id: c.id, label: c.name }));
    if (linkType === "project") return projects.map((p) => ({ id: p.id, label: p.name }));
    if (linkType === "deal") return deals.map((d) => ({ id: d.id, label: d.title }));
    return [];
  }, [linkType, clients, projects, deals]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateExpense({
        id: expense.id,
        date: String(fd.get("date") ?? ""),
        vendor: String(fd.get("vendor") ?? ""),
        amount: Number(fd.get("amount") ?? 0),
        categoryId: categoryId || undefined,
        linkType,
        linkId: linkType !== "none" ? linkId || undefined : undefined,
        billable,
        description: String(fd.get("description") ?? "") || undefined,
      });
      if (result.ok) router.push(`/depenses/${expense.id}`);
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dépense</CardTitle>
          <CardDescription>
            Lie une dépense à un projet, client ou deal pour suivre la marge.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Date" required>
              <Input name="date" type="date" defaultValue={expense.date} required />
            </FormField>
            <FormField label="Montant (CHF)" required>
              <Input
                name="amount"
                type="number"
                min={0}
                step="0.05"
                defaultValue={expense.amount}
                required
              />
            </FormField>
          </div>
          <FormField label="Fournisseur" required>
            <Input name="vendor" defaultValue={expense.vendor} required />
          </FormField>
          <FormField label="Description">
            <Textarea name="description" rows={2} defaultValue={expense.description ?? ""} />
          </FormField>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Catégorie">
              <Select value={categoryId || "none"} onValueChange={(v) => setCategoryId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="À catégoriser" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">À catégoriser</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Lié à">
              <Select
                value={linkType}
                onValueChange={(v) => {
                  setLinkType(v as ExpenseLink["type"]);
                  setLinkId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="project">Projet</SelectItem>
                  <SelectItem value="deal">Deal / prospect</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          {linkType !== "none" && linkOptions.length > 0 ? (
            <FormField label="Cible">
              <Select value={linkId} onValueChange={setLinkId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent>
                  {linkOptions.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          ) : null}

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={billable}
              onChange={(e) => setBillable(e.target.checked)}
              className="h-3.5 w-3.5 rounded border border-input accent-foreground"
            />
            Refacturable au client
          </label>
        </CardContent>
      </Card>

      <FormError message={error} />

      <FormActions pending={pending} />
    </form>
  );
}
