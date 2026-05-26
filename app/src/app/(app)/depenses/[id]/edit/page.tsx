import { notFound } from "next/navigation";
import { EditPageShell } from "@/components/shared/edit-page-shell";
import {
  getClients,
  getDeals,
  getExpenseById,
  getExpenseCategories,
  getProjects,
} from "@/lib/data";
import { ExpenseEditForm } from "@/components/expenses/expense-form";

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [expense, categories, clients, projects, deals] = await Promise.all([
    getExpenseById(id),
    getExpenseCategories(),
    getClients(),
    getProjects(),
    getDeals(),
  ]);
  if (!expense) notFound();
  return (
    <EditPageShell
      backHref={`/depenses/${expense.id}`}
      backLabel="Retour à la dépense"
      eyebrow="Dépense · Édition"
      title={expense.vendor}
      description="Modifie la dépense et son lien."
    >
      <ExpenseEditForm
        expense={expense}
        categories={categories}
        clients={clients}
        projects={projects}
        deals={deals}
      />
    </EditPageShell>
  );
}
