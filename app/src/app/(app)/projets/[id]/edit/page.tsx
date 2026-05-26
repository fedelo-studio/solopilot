import { notFound } from "next/navigation";
import { EditPageShell } from "@/components/shared/edit-page-shell";
import { getClients, getDeals, getProjectById } from "@/lib/data";
import { ProjectEditForm } from "@/components/projects/project-form";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project, clients, deals] = await Promise.all([
    getProjectById(id),
    getClients(),
    getDeals(),
  ]);
  if (!project) notFound();
  return (
    <EditPageShell
      backHref={`/projets/${project.id}`}
      backLabel="Retour au projet"
      eyebrow="Projet · Édition"
      title={project.name}
      description="Modifie les budgets, le client et le calendrier."
    >
      <ProjectEditForm project={project} clients={clients} deals={deals} />
    </EditPageShell>
  );
}
