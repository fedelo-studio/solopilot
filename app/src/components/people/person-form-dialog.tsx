"use client";

import { useState, useTransition, type ReactNode } from "react";
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
import { createPerson, updatePerson } from "@/app/actions/people";
import type { Person } from "@/types/domain";

interface Props {
  /** When present, the dialog is in edit mode and prefills from this person. */
  person?: Person;
  /** Custom trigger; defaults to a "+ Nouvelle personne" button. */
  trigger?: ReactNode;
}

export function PersonFormDialog({ person, trigger }: Props) {
  const router = useRouter();
  const isEdit = Boolean(person);
  const [open, setOpen] = useState(false);
  const [isActive, setIsActive] = useState(person?.isActive ?? true);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? "") || undefined,
      costRate: Number(fd.get("costRate") ?? 0),
      billableRate: Number(fd.get("billableRate") ?? 0),
      weeklyCapacityHours: Number(fd.get("weeklyCapacityHours") ?? 40),
      isActive,
      notes: String(fd.get("notes") ?? "") || undefined,
    };
    startTransition(async () => {
      const result = isEdit
        ? await updatePerson({ id: person!.id, ...payload })
        : await createPerson(payload);
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  const defaultTrigger = isEdit ? (
    <Button variant="ghost" size="icon" aria-label="Modifier la personne">
      <Pencil className="h-3.5 w-3.5" />
    </Button>
  ) : (
    <Button>
      <Plus className="h-4 w-4" />
      Nouvelle personne
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la personne" : "Nouvelle personne"}</DialogTitle>
          <DialogDescription>
            Nom, tarifs et capacité hebdomadaire — pas de compte ni de connexion créés. Utile pour
            toi-même ou pour un·e sous-traitant·e dont tu suis le temps et le coût.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Nom" required>
              <Input name="name" defaultValue={person?.name ?? ""} required autoFocus />
            </FormField>
            <FormField label="Email">
              <Input name="email" type="email" defaultValue={person?.email ?? ""} />
            </FormField>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <FormField label="Tarif coût (CHF/h)" hint="Coût réel du temps suivi.">
              <Input
                name="costRate"
                type="number"
                step="0.01"
                min={0}
                defaultValue={person?.costRate ?? 0}
              />
            </FormField>
            <FormField label="Tarif facturable (CHF/h)" hint="Si le projet n'a pas de tarif dédié.">
              <Input
                name="billableRate"
                type="number"
                step="0.01"
                min={0}
                defaultValue={person?.billableRate ?? 0}
              />
            </FormField>
            <FormField label="Capacité hebdo. (h)">
              <Input
                name="weeklyCapacityHours"
                type="number"
                step="0.5"
                min={0}
                defaultValue={person?.weeklyCapacityHours ?? 40}
              />
            </FormField>
          </div>
          <FormField label="Notes">
            <Textarea name="notes" rows={2} defaultValue={person?.notes ?? ""} />
          </FormField>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-3.5 w-3.5 rounded border border-input accent-foreground"
            />
            Active sur le roster
          </label>

          <FormError message={error} size="xs" />

          <DialogFormFooter
            pending={pending}
            submitLabel={isEdit ? "Enregistrer" : "Créer la personne"}
            pendingLabel="Enregistrement…"
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
