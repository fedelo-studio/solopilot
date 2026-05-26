"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  TrendingUp,
  FolderKanban,
  Receipt,
  FileSignature,
  Plus,
  LayoutDashboard,
  LineChart,
  CreditCard,
  Wallet,
  Settings,
  Banknote,
  Bell,
  BarChart3,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { searchIndex, type SearchHit, type SearchHitKind } from "@/app/actions/search";

const KIND_ICON: Record<SearchHitKind, typeof Users> = {
  client: Users,
  deal: TrendingUp,
  project: FolderKanban,
  invoice: Receipt,
  quote: FileSignature,
};

const KIND_LABEL: Record<SearchHitKind, string> = {
  client: "Clients",
  deal: "Deals",
  project: "Projets",
  invoice: "Factures",
  quote: "Devis",
};

const QUICK_ACTIONS = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard, shortcut: "g d" },
  { label: "Cashflow", href: "/cashflow", icon: LineChart, shortcut: "g c" },
  { label: "Rapports", href: "/rapports", icon: BarChart3, shortcut: "g r" },
  { label: "Alertes", href: "/alertes", icon: Bell },
  { label: "Pipeline", href: "/pipeline", icon: TrendingUp, shortcut: "g p" },
  { label: "Devis", href: "/devis", icon: FileSignature },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Projets", href: "/projets", icon: FolderKanban },
  { label: "Factures", href: "/factures", icon: Receipt, shortcut: "g f" },
  { label: "Dépenses", href: "/depenses", icon: CreditCard },
  { label: "Budgets", href: "/budgets", icon: Wallet },
  { label: "Comptes", href: "/comptes", icon: Banknote },
  { label: "Paramètres", href: "/parametres", icon: Settings, shortcut: "g s" },
];

const CREATE_ACTIONS = [
  { label: "Nouveau devis", href: "/devis/nouveau", icon: Plus },
  { label: "Nouvelle facture", href: "/factures/nouvelle", icon: Plus },
  { label: "Importer un CSV bancaire", href: "/comptes/import", icon: Plus },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: Props) {
  const router = useRouter();
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [, startTransition] = useTransition();

  // Load the search index once when the dialog first opens.
  useEffect(() => {
    if (!open) return;
    if (hits.length > 0) return;
    startTransition(async () => {
      try {
        const result = await searchIndex();
        setHits(result);
      } catch {
        setHits([]);
      }
    });
  }, [open, hits.length]);

  function go(href: string) {
    router.push(href);
    onOpenChange(false);
  }

  // Group hits by kind for the UI.
  const grouped = hits.reduce<Record<SearchHitKind, SearchHit[]>>(
    (acc, hit) => {
      acc[hit.kind].push(hit);
      return acc;
    },
    { client: [], deal: [], project: [], invoice: [], quote: [] },
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Rechercher un client, une facture, un deal…" />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>

        <CommandGroup heading="Créer">
          {CREATE_ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <CommandItem key={a.href} onSelect={() => go(a.href)} value={a.label}>
                <Icon className="text-muted-foreground" />
                <span>{a.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Aller à">
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <CommandItem key={a.href} onSelect={() => go(a.href)} value={a.label}>
                <Icon className="text-muted-foreground" />
                <span>{a.label}</span>
                {a.shortcut ? <CommandShortcut>{a.shortcut}</CommandShortcut> : null}
              </CommandItem>
            );
          })}
        </CommandGroup>

        {(Object.keys(grouped) as SearchHitKind[]).map((kind) => {
          const group = grouped[kind];
          if (group.length === 0) return null;
          const Icon = KIND_ICON[kind];
          return (
            <CommandGroup key={kind} heading={KIND_LABEL[kind]}>
              {group.slice(0, 6).map((hit) => (
                <CommandItem
                  key={`${kind}-${hit.id}`}
                  value={`${hit.title} ${hit.subtitle ?? ""}`}
                  onSelect={() => go(hit.href)}
                >
                  <Icon className="text-muted-foreground" />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{hit.title}</span>
                    {hit.subtitle ? (
                      <span className="text-meta truncate">{hit.subtitle}</span>
                    ) : null}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}

/** Wires Cmd/Ctrl+K + an optional trigger element. Place once in the app shell. */
export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Cmd/Ctrl + K — open palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      // ? — open shortcuts overlay (when not typing in a field)
      if (
        e.key === "?" &&
        !e.metaKey && !e.ctrlKey && !e.altKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setShortcutsOpen(true);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      {children}
      <CommandPalette open={open} onOpenChange={setOpen} />
      <ShortcutsOverlay open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </>
  );
}

const SHORTCUTS: Array<{ keys: string[]; label: string }> = [
  { keys: ["⌘", "K"], label: "Ouvrir la recherche" },
  { keys: ["?"], label: "Voir les raccourcis (cet écran)" },
  { keys: ["G", "D"], label: "Aller au tableau de bord" },
  { keys: ["G", "C"], label: "Aller au cashflow" },
  { keys: ["G", "P"], label: "Aller au pipeline" },
  { keys: ["G", "F"], label: "Aller aux factures" },
  { keys: ["G", "R"], label: "Aller aux rapports" },
  { keys: ["G", "S"], label: "Aller aux paramètres" },
  { keys: ["Esc"], label: "Fermer un dialog" },
];

function ShortcutsOverlay({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Raccourcis clavier</DialogTitle>
          <DialogDescription>Pour naviguer SoloPilot encore plus vite.</DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 text-sm">
          {SHORTCUTS.map((s) => (
            <li key={s.label} className="flex items-center justify-between gap-3">
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
      </DialogContent>
    </Dialog>
  );
}
