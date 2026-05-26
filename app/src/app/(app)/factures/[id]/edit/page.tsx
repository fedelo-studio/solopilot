import { notFound } from "next/navigation";
import { EditPageShell } from "@/components/shared/edit-page-shell";
import { getClients, getInvoiceById, getProjects } from "@/lib/data";
import { InvoiceEditForm } from "@/components/invoices/invoice-edit-form";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [invoice, clients, projects] = await Promise.all([
    getInvoiceById(id),
    getClients(),
    getProjects(),
  ]);
  if (!invoice) notFound();
  return (
    <EditPageShell
      backHref={`/factures/${invoice.id}`}
      backLabel="Retour à la facture"
      eyebrow="Facture · Édition"
      title={`#${invoice.number}`}
      description="Modifie les lignes, le client, l'échéance."
      maxWidth="max-w-5xl"
    >
      <InvoiceEditForm invoice={invoice} clients={clients} projects={projects} />
    </EditPageShell>
  );
}
