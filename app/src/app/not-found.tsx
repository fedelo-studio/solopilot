import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandWordmark } from "@/components/shared/brand-mark";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-12">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <BrandWordmark height={32} />
          <div className="eyebrow">Erreur 404</div>
        </div>
        <h1 className="t-display text-3xl">Cette page n&apos;existe pas.</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Soit le lien est cassé, soit l&apos;élément a été supprimé. Reviens au tableau de bord pour
          retrouver ton activité.
        </p>
        <Button asChild>
          <Link href="/dashboard">Retour au tableau de bord</Link>
        </Button>
      </div>
    </div>
  );
}
