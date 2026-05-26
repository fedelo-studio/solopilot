"use client";

import { useEffect, useState } from "react";
import { Bell, Search, Plus, ChevronDown, LogOut, Settings, HelpCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MobileNav } from "./mobile-nav";
import { CommandPalette } from "./command-palette";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopbarProps {
  companyName: string;
  ownerName: string;
}

export function Topbar({ companyName, ownerName }: TopbarProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
    }
  }, []);

  // Global Cmd+K / Ctrl+K — opens the palette from anywhere in the app shell.
  // Also handles `?` to navigate to /aide (Raycast-style).
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
      if (
        e.key === "?" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        e.preventDefault();
        window.location.assign("/aide");
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const initials = ownerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md md:px-6">
        <MobileNav />

        {/* Search trigger — opens command palette. Mimics the Input primitive's
            visual rest state so the topbar reads as "ready to type". */}
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="group inline-flex h-9 flex-1 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 md:max-w-md"
          aria-label="Rechercher (⌘K)"
        >
          <Search className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
          <span className="flex-1 text-left">Rechercher…</span>
          <kbd className="kbd hidden sm:inline-flex">
            <span aria-hidden>{isMac ? "⌘" : "Ctrl"}</span>
            <span>K</span>
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" className="hidden gap-2 sm:inline-flex" asChild>
            <Link href="/factures/nouvelle">
              <Plus className="h-4 w-4" />
              <span className="hidden lg:inline">Nouvelle facture</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild aria-label="Alertes">
            <Link href="/alertes">
              <Bell className="h-4 w-4" />
            </Link>
          </Button>
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Compte de ${ownerName}`}
                className="ml-2 flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden text-right leading-tight sm:block">
                  <div className="text-xs font-medium">{companyName}</div>
                  <div className="text-meta text-muted-foreground">{ownerName}</div>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{companyName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/parametres">
                  <Settings className="h-3.5 w-3.5" />
                  Paramètres
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/aide">
                  <HelpCircle className="h-3.5 w-3.5" />
                  Aide & raccourcis
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/login">
                  <LogOut className="h-3.5 w-3.5" />
                  Se déconnecter
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}
