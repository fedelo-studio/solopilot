import { PageHeader } from "@/components/shared/page-header";
import { getAccounts } from "@/lib/data";
import { ImportForm } from "./import-form";

export default async function ImportPage() {
  const accounts = await getAccounts();
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Comptes · Import"
        title="Importer un relevé bancaire"
        description="Ajoute des transactions à partir d'un export CSV de ta banque. La détection des colonnes est automatique."
      />
      <ImportForm accounts={accounts} />
    </div>
  );
}
