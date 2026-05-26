"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recomputeAlerts } from "@/app/actions/alerts";

export function RecomputeAlertsButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      const result = await recomputeAlerts();
      if (result.ok) {
        const { created, resolved } = result.data;
        setMessage(
          created === 0 && resolved === 0
            ? "À jour"
            : `${created} nouvelle${created > 1 ? "s" : ""}, ${resolved} résolue${resolved > 1 ? "s" : ""}`,
        );
        router.refresh();
        // Auto-clear after 4s.
        setTimeout(() => setMessage(null), 4000);
      } else {
        setMessage(result.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        disabled={pending}
        aria-label="Recalculer les alertes"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );
}
