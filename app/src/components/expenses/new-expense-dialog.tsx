"use client";

import { useMemo, useState, useTransition } from "react";
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
import { createExpense } from "@/app/actions/expenses";
import type { Client, Deal, ExpenseCategory, ExpenseLink, Project } from "@/types/domain";

interface NewExpenseDialogProps {
  categories: ExpenseCategory[];
  clients: Client[];
  projects: Project[];
  deals: Deal[];
}

export function NewExpenseDialog({ categories, clients, projects, deals }: NewExpenseDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<string>("");
  const [linkType, setLinkType] = useState<ExpenseLink["type"]>("none");
  const [linkId, setLinkId] = useState<string>("");
  const [billable, setBillable] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const linkOptions = useMemo(() => {
    if (linkType === "client") return clients.map((c) => ({ id: c.id, label: c.name }));
    if (linkType === "project") return projects.map((p) => ({ id: p.id, label: p.name }));
    if (linkType === "deal") return deals.map((d) => ({ id: d.id, label: d.title }));
    return [];
  }, [linkType, clients, projects, deals]);

  async function handleSubmit(formData: FormData) {
    setErrors({});
    setGlobalError(null);
    if (categoryId) formData.set("categoryId", categoryId);
    formData.set("linkType", linkType);
    if (linkType !== "none" && linkId) formData.set("linkId", linkId);
    if (billable) formData.set("billable", "on");

    startTransition(async () => {
      const result = await createExpense(formData);
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setErrors(result.fields ?? {});
        setGlobalError(result.error);
      }
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Nouvelle dépense
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle dépense</DialogTitle>
          <DialogDescription>
            Lie une dépense à un prospect, client ou projet pour qu'elle impacte la marge.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Date" htmlFor="date" required error={errors.date}>
              <Input id="date" name="date" type="date" defaultValue={today} required />
            </FormField>
            <FormField label="Montant (CHF)" htmlFor="amount" required error={errors.amount}>
              <Input id="amount" name="amount" type="number" min={0} step="0.05" required />
            </FormField>
          </div>

          <FormField label="Fournisseur" htmlFor="vendor" required error={errors.vendor}>
            <Input id="vendor" name="vendor" placeholder="Figma Inc., CFF, Lina Pereira…" required />
          </FormField>

          <FormField label="Description" htmlFor="description">
            <Textarea id="description" name="description" rows={2} placeholder="Optionnel" />
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

          <FormError message={globalError} size="xs" />

          <DialogFormFooter
            pending={pending}
            submitLabel="Créer la dépense"
            pendingLabel="Création…"
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
