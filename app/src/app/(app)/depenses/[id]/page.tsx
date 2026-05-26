import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Pencil, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Money } from "@/components/shared/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  getClientById,
  getDealById,
  getExpenseById,
  getExpenseCategories,
  getProjectById,
} from "@/lib/data";
import { formatDate } from "@/lib/finance/format";
import { ExpenseRowActions } from "@/components/expenses/expense-row-actions";

export default async function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const expense = await getExpenseById(id);
  if (!expense) notFound();

  const [categories, link] = await Promise.all([
    getExpenseCategories(),
    (async () => {
      if (expense.link.type === "client") {
        const c = await getClientById(expense.link.id);
        return c ? { kind: "client" as const, id: c.id, label: c.name, href: `/clients/${c.id}` } : null;
      }
      if (expense.link.type === "project") {
        const p = await getProjectById(expense.link.id);
        return p ? { kind: "project" as const, id: p.id, label: p.name, href: `/projets/${p.id}` } : null;
      }
      if (expense.link.type === "deal") {
        const d = await getDealById(expense.link.id);
        return d ? { kind: "deal" as const, id: d.id, label: d.title, href: `/pipeline/${d.id}` } : null;
      }
      return null;
    })(),
  ]);

  const category = expense.categoryId
    ? categories.find((c) => c.id === expense.categoryId)
    : null;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/depenses"
        className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-3 w-3" />
        Toutes les dépenses
      </Link>

      <PageHeader
        eyebrow={`Dépense · ${formatDate(expense.date)}`}
        title={expense.vendor}
        description={expense.description ?? undefined}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/depenses/${expense.id}/edit`}>
                <Pencil className="h-4 w-4" />
                Modifier
              </Link>
            </Button>
            <ExpenseRowActions expenseId={expense.id} vendor={expense.vendor} />
          </>
        }
      />

      <Card className="mb-4">
        <CardContent className="p-5">
          <Money amount={expense.amount} className="text-3xl font-medium" />
          <div className="mt-1 text-xs text-muted-foreground">Devise : {expense.currency}</div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Classification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Catégorie">
            {category ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
                {category.name}
              </span>
            ) : (
              <Badge variant="warning">À catégoriser</Badge>
            )}
          </Row>
          <Row label="Refacturable">
            {expense.billable ? (
              <Badge variant="probable">Refacturable</Badge>
            ) : (
              <span className="text-muted-foreground">Non</span>
            )}
          </Row>
          <Row label="Liée à">
            {link ? (
              <Link href={link.href} className="font-medium hover:underline">
                {link.label}
              </Link>
            ) : (
              <span className="text-muted-foreground">Aucun lien</span>
            )}
          </Row>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{children}</span>
    </div>
  );
}
// Silence unused-warning until we add a direct delete button.
void Trash2;
