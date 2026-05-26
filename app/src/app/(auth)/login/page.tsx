"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseReady } from "@/lib/supabase/env";
import { BrandWordmark } from "@/components/shared/brand-mark";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    const supabase = createClient();
    if (!supabase) {
      setStatus("error");
      setErrorMessage("Supabase n'est pas encore configuré. Renseigne .env.local pour activer l'authentification.");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col gap-2">
          <BrandWordmark height={32} />
          <div className="eyebrow">Cockpit business</div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Se connecter</CardTitle>
            <CardDescription>
              On t'envoie un lien magique pour entrer en un clic. Pas besoin de mot de passe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === "sent" ? (
              <div className="rounded-md border border-confirmed/40 bg-confirmed-soft px-3 py-3 text-sm text-confirmed">
                Lien envoyé. Ouvre ta boîte mail et clique sur le lien pour te connecter.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  type="email"
                  placeholder="tu@studio.ch"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <Button type="submit" className="w-full" disabled={status === "loading"}>
                  {status === "loading" ? "Envoi…" : "Recevoir le lien magique"}
                </Button>
                {errorMessage ? (
                  <p className="text-xs text-danger">{errorMessage}</p>
                ) : null}
              </form>
            )}
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 border-t border-border/70 pt-4">
            <p className="text-xs text-muted-foreground">
              En continuant, tu acceptes les conditions d'utilisation de SoloPilot.
            </p>
            {!isSupabaseReady ? (
              <p className="text-xs text-warning">
                Mode démo — l'authentification réelle s'activera après configuration de
                Supabase (voir <code className="rounded bg-muted px-1">.env.local.example</code>).
              </p>
            ) : null}
          </CardFooter>
        </Card>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/dashboard" className="underline-offset-2 hover:underline">
            Continuer en mode démo
          </Link>
        </div>
      </div>
    </div>
  );
}
