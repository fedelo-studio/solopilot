import { PageHeader } from "@/components/shared/page-header";
import { getClients, getDeals } from "@/lib/data";
import { NewProjectForm } from "./new-project-form";

export default async function NewProjectPage() {
  const [clients, deals] = await Promise.all([getClients(), getDeals()]);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Opérations · Nouveau projet"
        title="Créer un projet"
        description="Un projet regroupe le budget vendu, les coûts internes et les factures associées."
      />
      <NewProjectForm clients={clients} deals={deals} />
    </div>
  );
}
