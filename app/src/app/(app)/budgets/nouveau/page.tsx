import { PageHeader } from "@/components/shared/page-header";
import { getExpenseCategories } from "@/lib/data";
import { BudgetForm } from "@/components/budgets/budget-form";

export default async function NewBudgetPage() {
  const categories = await getExpenseCategories();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Finances · Nouveau budget"
        title="Créer un budget"
        description="Définis un plafond mensuel pour une catégorie de dépenses."
      />
      <BudgetForm categories={categories} />
    </div>
  );
}
