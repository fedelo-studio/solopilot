import { PageHeader } from "@/components/shared/page-header";
import { getClients, getProjects, nextInvoiceNumber } from "@/lib/data";
import { mockCompany } from "@/lib/mock";
import { NewInvoiceForm } from "./new-invoice-form";

export default async function NewInvoicePage() {
  const [clients, projects, defaultNumber] = await Promise.all([
    getClients(),
    getProjects(),
    nextInvoiceNumber(),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Finances · Nouvelle facture"
        title="Créer une facture"
        description="Renseigne le client, l'échéance et les lignes. Les totaux et la TVA se calculent automatiquement."
      />
      <NewInvoiceForm
        clients={clients}
        projects={projects}
        defaultNumber={defaultNumber}
        defaultVatRate={mockCompany.defaultVatRate}
      />
    </div>
  );
}
