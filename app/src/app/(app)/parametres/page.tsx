import Link from "next/link";
import { Tag, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { getCompanySettings } from "@/lib/data";
import { SettingsForm } from "./settings-form";

export default async function ParametresPage() {
  const settings = await getCompanySettings();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Configuration"
        title="Paramètres"
        description="Identité de l'entreprise, paramètres par défaut pour les factures et le cashflow."
      />
      <SettingsForm initial={settings} />

      <Card className="mt-6">
        <CardContent className="p-0">
          <Link
            href="/parametres/categories"
            className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-accent/40"
          >
            <span className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              <span>
                <span className="block text-sm font-medium">Catégories de dépenses</span>
                <span className="block text-xs text-muted-foreground">
                  Personnalise nom et couleur des catégories utilisées partout.
                </span>
              </span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
