import { notFound } from "next/navigation";
import { EditPageShell } from "@/components/shared/edit-page-shell";
import { getClients, getQuoteById } from "@/lib/data";
import { QuoteEditForm } from "@/components/quotes/quote-edit-form";

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [quote, clients] = await Promise.all([getQuoteById(id), getClients()]);
  if (!quote) notFound();
  return (
    <EditPageShell
      backHref={`/devis/${quote.id}`}
      backLabel="Retour au devis"
      eyebrow="Devis · Édition"
      title={quote.number}
      description="Modifie les lignes, le client, la validité."
      maxWidth="max-w-5xl"
    >
      <QuoteEditForm quote={quote} clients={clients} />
    </EditPageShell>
  );
}
