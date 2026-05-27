"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BrandWordmark } from "@/components/shared/brand-mark";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <BrandWordmark height={32} />
        <div className="eyebrow">Erreur inattendue</div>
      </div>
      <h2 className="t-display text-2xl">Quelque chose s&apos;est mal passé.</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Le cockpit a rencontré une erreur. Tu peux réessayer — si ça persiste, recharge la page.
      </p>
      <div className="flex gap-2">
        <Button onClick={() => reset()}>Réessayer</Button>
        <Button variant="ghost" onClick={() => location.reload()}>
          Recharger
        </Button>
      </div>
      {error.digest ? (
        <p className="text-meta font-mono uppercase text-muted-foreground">
          Réf · {error.digest}
        </p>
      ) : null}
    </div>
  );
}
