import { PageHeader } from "@/components/shared/page-header";
import { getClients, getCompanySettings, nextQuoteNumber } from "@/lib/data";
import { NewQuoteForm } from "./new-quote-form";

export default async function NewQuotePage() {
  const [clients, defaultNumber, company] = await Promise.all([
    getClients(),
    nextQuoteNumber(),
    getCompanySettings(),
  ]);
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Commercial · Nouveau devis"
        title="Créer un devis"
        description="Une proposition commerciale qui pourra être convertie en facture une fois acceptée."
      />
      <NewQuoteForm clients={clients} defaultNumber={defaultNumber} defaultVatRate={company.defaultVatRate} />
    </div>
  );
}
