import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { getExpenseCategories } from "@/lib/data";
import { CategoriesList } from "./categories-list";

export default async function CategoriesPage() {
  const categories = await getExpenseCategories();
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/parametres"
        className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-3 w-3" />
        Paramètres
      </Link>
      <PageHeader
        eyebrow="Paramètres"
        title="Catégories de dépenses"
        description="Personnalise les catégories utilisées dans les dépenses, budgets et rapports."
      />
      <CategoriesList categories={categories} />
    </div>
  );
}
