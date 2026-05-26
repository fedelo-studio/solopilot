import { notFound } from "next/navigation";
import { EditPageShell } from "@/components/shared/edit-page-shell";
import { getClients, getDealById } from "@/lib/data";
import { DealEditForm } from "@/components/pipeline/deal-form";

export default async function EditDealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [deal, clients] = await Promise.all([getDealById(id), getClients()]);
  if (!deal) notFound();
  return (
    <EditPageShell
      backHref={`/pipeline/${deal.id}`}
      backLabel="Retour au deal"
      eyebrow="Deal · Édition"
      title={deal.title}
      description="Modifie les informations du deal."
    >
      <DealEditForm deal={deal} clients={clients} />
    </EditPageShell>
  );
}
