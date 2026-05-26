import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BrandMark } from "@/components/shared/brand-mark";

const SHORTCUTS = [
  { keys: ["⌘", "K"], label: "Ouvrir la recherche globale" },
  { keys: ["?"], label: "Afficher cette aide" },
  { keys: ["G", "D"], label: "Tableau de bord" },
  { keys: ["G", "C"], label: "Cashflow" },
  { keys: ["G", "P"], label: "Pipeline" },
  { keys: ["G", "F"], label: "Factures" },
  { keys: ["G", "R"], label: "Rapports" },
  { keys: ["G", "A"], label: "Alertes" },
  { keys: ["G", "S"], label: "Paramètres" },
];

const FAQ = [
  {
    q: "Pourquoi un montant est-il pondéré sur le pipeline ?",
    a: "Un deal non signé a une probabilité de signature (10% pour un lead, 100% pour un deal gagné). La valeur pondérée = montant estimé × probabilité. Tout le cashflow s'appuie là-dessus pour distinguer le confirmé du probable.",
  },
  {
    q: "Comment SoloPilot gère la TVA ?",
    a: "La TVA est saisie par ligne de facture, avec un taux par défaut configurable dans les paramètres. SoloPilot ne fait aucune déclaration ni vérification fiscale — à valider avec ton comptable selon ton régime.",
  },
  {
    q: "Quelle différence entre 'confirmé', 'probable' et 'hypothétique' ?",
    a: "Confirmé = factures émises (statut envoyée ou payée). Probable = deals au-dessus de 60% de probabilité. Hypothétique = deals à moins de 60%. Les trois s'empilent dans la projection cashflow.",
  },
  {
    q: "Comment convertir un devis en facture ?",
    a: "Sur la page d'un devis accepté, clique sur 'Convertir en facture'. Les lignes, le client et les totaux sont copiés. La nouvelle facture est créée en brouillon.",
  },
  {
    q: "Les paiements partiels sont-ils possibles ?",
    a: "Oui. Sur une facture, ouvre 'Enregistrer un paiement'. Tu peux ajouter plusieurs paiements partiels. Le solde et le statut se mettent à jour automatiquement quand le total est atteint.",
  },
  {
    q: "Comment importer mes transactions bancaires ?",
    a: "Comptes → Importer un CSV. SoloPilot détecte automatiquement les colonnes date, libellé, montant (ou débit/crédit séparés), et le format suisse 1'250.50.",
  },
  {
    q: "L'app fonctionne sans Supabase ?",
    a: "Oui — en mode démo (NEXT_PUBLIC_DATA_MODE=mock), tu vois des données fictives. Aucune écriture n'est persistée mais tous les écrans fonctionnent.",
  },
  {
    q: "Comment activer les relances automatiques par email ?",
    a: "L'edge function invoice-reminders existe et a juste besoin d'être déployée (supabase functions deploy invoice-reminders) puis planifiée via pg_cron — voir le README dans supabase/functions/invoice-reminders/.",
  },
];

export default function AidePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Aide"
        title="Documentation & raccourcis"
        description="Tout ce qu'il faut savoir pour piloter SoloPilot efficacement."
      />

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle>Raccourcis clavier</CardTitle>
            <CardDescription>Naviguer aussi vite que dans Linear ou Raycast.</CardDescription>
          </div>
          <BrandMark size={28} className="opacity-60" />
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5 text-sm">
            {SHORTCUTS.map((s) => (
              <li
                key={s.label}
                className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/40"
              >
                <span className="text-muted-foreground">{s.label}</span>
                <span className="flex items-center gap-1">
                  {s.keys.map((k) => (
                    <kbd key={k} className="kbd">
                      {k}
                    </kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Foire aux questions</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {FAQ.map((item) => (
            <details key={item.q} className="group py-3">
              <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-foreground hover:text-foreground/80">
                {item.q}
                <span className="ml-3 text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ressources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <Link href="/parametres" className="underline underline-offset-2">
              Paramètres entreprise
            </Link>{" "}
            — TVA par défaut, réserve, IBAN, footer de facture.
          </p>
          <p className="text-muted-foreground">
            Pour des questions fiscales (TVA, AVS, impôts), SoloPilot ne remplace pas un comptable.
            Toutes les valeurs configurables (taux, % réserve) sont des hypothèses produit à
            valider avec un professionnel.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
