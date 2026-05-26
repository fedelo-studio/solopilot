import { notFound } from "next/navigation";
import { EditPageShell } from "@/components/shared/edit-page-shell";
import { getBudgetById, getExpenseCategories } from "@/lib/data";
import { BudgetForm } from "@/components/budgets/budget-form";

export default async function EditBudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [budget, categories] = await Promise.all([
    getBudgetById(id),
    getExpenseCategories(),
  ]);
  if (!budget) notFound();
  const category = categories.find((c) => c.id === budget.categoryId);
  return (
    <EditPageShell
      backHref="/budgets"
      backLabel="Retour aux budgets"
      eyebrow="Budget · Édition"
      title={category?.name ?? "Budget"}
      description="Modifie le plafond ou la période."
    >
      <BudgetForm budget={budget} categories={categories} />
    </EditPageShell>
  );
}
