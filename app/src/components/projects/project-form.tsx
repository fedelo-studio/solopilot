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
import { updateProject } from "@/app/actions/projects";
import type { Client, Deal, Project, ProjectStatus } from "@/types/domain";

interface Props {
  project: Project;
  clients: Client[];
  deals: Deal[];
}

export function ProjectEditForm({ project, clients, deals }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [clientId, setClientId] = useState(project.clientId);
  const [dealId, setDealId] = useState(project.dealId ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [soldBudget, setSoldBudget] = useState(project.soldBudget);
  const [internalBudget, setInternalBudget] = useState(project.internalBudget);
  const [error, setError] = useState<string | null>(null);

  const filteredDeals = deals.filter((d) => d.clientId === clientId && d.stage !== "lost");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateProject({
        id: project.id,
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
      if (result.ok) router.push(`/projets/${project.id}`);
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Projet</CardTitle>
          <CardDescription>Modifie les budgets, le client et le calendrier.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Nom" required>
            <Input name="name" defaultValue={project.name} required autoFocus />
          </FormField>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Client" required>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue />
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
            <FormField label="Deal d'origine">
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
            <FormField label="Budget interne (CHF)">
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
              <Input type="date" name="startDate" defaultValue={project.startDate ?? ""} />
            </FormField>
            <FormField label="Fin">
              <Input type="date" name="endDate" defaultValue={project.endDate ?? ""} />
            </FormField>
          </div>
          <FormField label="Notes">
            <Textarea name="notes" rows={3} defaultValue={project.notes ?? ""} />
          </FormField>
        </CardContent>
      </Card>

      <FormError message={error} />

      <FormActions pending={pending} />
    </form>
  );
}
