import { PageHeader } from "@/components/shared/page-header";
import { getAccounts, getDeals, getExpenses, getInvoices } from "@/lib/data";
import { currentCash, projectCashflow } from "@/lib/finance/cashflow";
import { ScenarioTabs } from "./scenario-tabs";

const HORIZON = 90;

export default async function CashflowPage() {
  const [accounts, deals, expenses, invoices] = await Promise.all([
    getAccounts(),
    getDeals(),
    getExpenses(),
    getInvoices(),
  ]);
  const cash = currentCash(accounts);
  const entries = projectCashflow({ invoices, deals, expenses, horizonDays: HORIZON });

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Pilotage"
        title="Cashflow — 90 jours"
        description="Trois scénarios pour cadrer la fourchette : du pire cas confirmé au meilleur cas signé."
      />

      <ScenarioTabs entries={entries} startingCash={cash} deals={deals} horizonDays={HORIZON} />

      <p className="mt-6 text-xs text-muted-foreground">
        Hypothèses produit : les deals sont projetés à la valeur pondérée (réaliste) ou pleine
        (optimiste) sur leur date de paiement attendue. Aucune règle fiscale n'est appliquée
        automatiquement — à valider avec un comptable.
      </p>
    </div>
  );
}
