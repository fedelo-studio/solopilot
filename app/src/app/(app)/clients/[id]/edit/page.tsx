import { notFound } from "next/navigation";
import { EditPageShell } from "@/components/shared/edit-page-shell";
import { getClientById } from "@/lib/data";
import { EditClientForm } from "./edit-client-form";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();
  return (
    <EditPageShell
      backHref={`/clients/${client.id}`}
      backLabel="Retour à la fiche client"
      eyebrow="Client · Édition"
      title={client.name}
      description="Modifie les informations du client. Les changements impactent les factures et devis liés."
    >
      <EditClientForm client={client} />
    </EditPageShell>
  );
}
