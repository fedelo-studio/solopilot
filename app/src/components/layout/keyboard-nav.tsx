"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** "g d", "g c", "g p", … sequence navigation à la GitHub/Linear.
 *  Listens for a 'g' tap followed (within 700ms) by a single key.
 *  Disabled while focus is in a text field. */
const ROUTES: Record<string, string> = {
  d: "/dashboard",
  c: "/cashflow",
  p: "/pipeline",
  f: "/factures",
  r: "/rapports",
  s: "/parametres",
  a: "/alertes",
};

export function KeyboardNav() {
  const router = useRouter();

  useEffect(() => {
    let primed = false;
    let timer: number | undefined;

    function isTyping(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target.isContentEditable
      );
    }

    function handler(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTyping(e.target)) return;

      if (!primed && e.key.toLowerCase() === "g") {
        primed = true;
        if (timer) window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          primed = false;
        }, 700);
        return;
      }

      if (primed) {
        primed = false;
        if (timer) window.clearTimeout(timer);
        const target = ROUTES[e.key.toLowerCase()];
        if (target) {
          e.preventDefault();
          router.push(target);
        }
      }
    }

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      if (timer) window.clearTimeout(timer);
    };
  }, [router]);

  return null;
}
