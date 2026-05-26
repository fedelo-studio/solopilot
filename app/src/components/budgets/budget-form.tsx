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
import { createBudget, updateBudget } from "@/app/actions/budgets";
import type { Budget, ExpenseCategory } from "@/types/domain";
import { format, startOfMonth } from "date-fns";

interface Props {
  budget?: Budget;
  categories: ExpenseCategory[];
}

export function BudgetForm({ budget, categories }: Props) {
  const router = useRouter();
  const isEdit = Boolean(budget);
  const [pending, startTransition] = useTransition();
  const [periodMonth, setPeriodMonth] = useState(
    budget?.periodMonth ?? format(startOfMonth(new Date()), "yyyy-MM-dd"),
  );
  const [categoryId, setCategoryId] = useState(budget?.categoryId ?? "");
  const [plannedAmount, setPlannedAmount] = useState(budget?.plannedAmount ?? 0);
  const [notes, setNotes] = useState(budget?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!categoryId) {
      setError("Sélectionne une catégorie.");
      return;
    }
    startTransition(async () => {
      const payload = {
        periodMonth,
        categoryId,
        plannedAmount,
        notes: notes || undefined,
      };
      const result = isEdit
        ? await updateBudget({ id: budget!.id, ...payload })
        : await createBudget(payload);
      if (result.ok) router.push("/budgets");
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Budget mensuel</CardTitle>
          <CardDescription>
            Plafond de dépenses pour une catégorie sur un mois donné.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Mois" required hint="Sélectionne le 1er du mois.">
              <Input
                type="date"
                value={periodMonth}
                onChange={(e) => setPeriodMonth(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Catégorie" required>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <FormField label="Plafond (CHF)" required>
            <Input
              type="number"
              min={0}
              step={50}
              value={plannedAmount}
              onChange={(e) => setPlannedAmount(Number(e.target.value))}
              required
            />
          </FormField>
          <FormField label="Notes">
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optionnel — pourquoi ce plafond, etc."
            />
          </FormField>
        </CardContent>
      </Card>

      <FormError message={error} />

      <FormActions
        pending={pending}
        submitLabel={isEdit ? "Enregistrer" : "Créer le budget"}
      />
    </form>
  );
}
