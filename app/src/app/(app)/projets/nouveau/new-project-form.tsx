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
import { createProject } from "@/app/actions/projects";
import type { Client, Deal, ProjectStatus } from "@/types/domain";

export function NewProjectForm({
  clients,
  deals,
}: {
  clients: Client[];
  deals: Deal[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [clientId, setClientId] = useState("");
  const [dealId, setDealId] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [soldBudget, setSoldBudget] = useState(0);
  const [internalBudget, setInternalBudget] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (!clientId) {
      setError("Sélectionne un client.");
      return;
    }
    startTransition(async () => {
      const result = await createProject({
        name: String(fd.get("name") ?? ""),
        clientId,
        dealId: dealId || undefined,
        status,
        soldBudget,
        internalBudget,
        startDate: String(fd.get("startDate") ?? "") || undefined,
        endDate: String(fd.get("endDate") ?? "") || undefined,
        notes: String(fd.get("notes") ?? "") || undefined,
      });
      if (result.ok) router.push("/projets");
      else setError(result.error);
    });
  }

  // Only deals tied to the selected client (or unclient'd deals if no client picked).
  const filteredDeals = clientId
    ? deals.filter((d) => d.clientId === clientId && d.stage !== "lost")
    : deals.filter((d) => !d.clientId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identité</CardTitle>
          <CardDescription>Un projet doit être attaché à un client.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Nom du projet" required>
            <Input name="name" placeholder="Refonte branding — Studio Lumen" required autoFocus />
          </FormField>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Client" required>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Deal d'origine" hint="Optionnel — pour traçabilité.">
              <Select value={dealId || "none"} onValueChange={(v) => setDealId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Aucun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {filteredDeals.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Budgets et calendrier</CardTitle>
          <CardDescription>La marge sera : vendu − (interne + dépenses liées).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Budget vendu (CHF)" required>
              <Input
                type="number"
                min={0}
                step={100}
                value={soldBudget}
                onChange={(e) => setSoldBudget(Number(e.target.value))}
                required
              />
            </FormField>
            <FormField label="Budget interne (CHF)" hint="Ce que tu allouas en temps + coûts.">
              <Input
                type="number"
                min={0}
                step={100}
                value={internalBudget}
                onChange={(e) => setInternalBudget(Number(e.target.value))}
              />
            </FormField>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <FormField label="Statut">
              <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="paused">En pause</SelectItem>
                  <SelectItem value="done">Terminé</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Démarrage">
              <Input type="date" name="startDate" />
            </FormField>
            <FormField label="Fin prévue">
              <Input type="date" name="endDate" />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea name="notes" rows={3} placeholder="Périmètre, points d'attention, prochains jalons…" />
        </CardContent>
      </Card>

      <FormError message={error} />

      <FormActions pending={pending} submitLabel="Créer le projet" pendingLabel="Création…" />
    </form>
  );
}
