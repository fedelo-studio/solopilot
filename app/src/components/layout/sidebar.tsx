"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  FolderKanban,
  Receipt,
  CreditCard,
  Wallet,
  LineChart,
  Settings,
  Banknote,
  FileSignature,
  BarChart3,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import { BrandMark, BrandWordmark } from "@/components/shared/brand-mark";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Pilotage",
    items: [
      { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
      { label: "Cashflow", href: "/cashflow", icon: LineChart },
      { label: "Rapports", href: "/rapports", icon: BarChart3 },
      { label: "Alertes", href: "/alertes", icon: Bell },
    ],
  },
  {
    label: "Commercial",
    items: [
      { label: "Pipeline", href: "/pipeline", icon: KanbanSquare },
      { label: "Devis", href: "/devis", icon: FileSignature },
      { label: "Clients", href: "/clients", icon: Users },
      { label: "Projets", href: "/projets", icon: FolderKanban },
    ],
  },
  {
    label: "Finances",
    items: [
      { label: "Factures", href: "/factures", icon: Receipt },
      { label: "Dépenses", href: "/depenses", icon: CreditCard },
      { label: "Budgets", href: "/budgets", icon: Wallet },
      { label: "Comptes", href: "/comptes", icon: Banknote },
    ],
  },
];

interface SidebarProps {
  /** Desktop = sticky rail with collapse affordance.
   *  Mobile  = full-width content inside the Sheet (no collapse, no sticky). */
  variant?: "desktop" | "mobile";
}

const STORAGE_KEY = "solopilot:sidebar:collapsed";

/* Sidebar — sticky rail that stays in viewport while content scrolls.
 *
 * Desktop variant supports a collapsed state (icons-only, 56px) and an
 * expanded state (240px). Collapse preference is persisted in localStorage.
 *
 * When collapsed, every nav row is wrapped in a Tooltip so labels remain
 * discoverable without taking screen real estate.
 */
export function Sidebar({ variant = "desktop" }: SidebarProps) {
  const pathname = usePathname();
  const isDesktop = variant === "desktop";

  // Collapsed state — client-only, hydrates from localStorage.
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "1") setCollapsed(true);
    } catch {
      // localStorage blocked — fall back to expanded.
    }
    setHydrated(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  // Mobile rail = always expanded (it's inside a sheet).
  const showCollapsed = isDesktop && collapsed;

  return (
    <aside
      data-collapsed={showCollapsed ? "true" : "false"}
      aria-label="Navigation principale"
      className={cn(
        "flex shrink-0 flex-col border-r border-border bg-card/40",
        // Desktop rail: sticky to viewport, fixed full-viewport height — does not scroll with page content.
        // `self-start` opts out of the flex parent's `align-items: stretch`, which is required for `sticky` to work inside flex.
        isDesktop
          ? "sticky top-0 hidden h-screen self-start md:flex"
          : "h-full w-full",
        // Width: animated only after hydration so first paint matches the saved state without easing in.
        isDesktop && (showCollapsed ? "w-[68px]" : "w-60"),
        hydrated && isDesktop && "transition-[width] duration-200 ease-[var(--ease-out)] motion-reduce:transition-none",
      )}
    >
      {/* ─── Brand ─── */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-border/70",
          showCollapsed ? "justify-center px-2" : "px-4",
        )}
      >
        <Link
          href="/dashboard"
          aria-label="SoloPilot — Tableau de bord"
          className="inline-flex items-center rounded-md outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        >
          {showCollapsed ? (
            <BrandMark size={22} />
          ) : (
            <BrandWordmark height={18} />
          )}
        </Link>
      </div>

      {/* ─── Nav ─── */}
      <nav
        className={cn(
          "flex flex-1 flex-col gap-5 overflow-y-auto scrollbar-thin py-4",
          showCollapsed ? "px-2" : "px-3",
        )}
        aria-label="Modules"
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            {showCollapsed ? (
              <div
                aria-hidden
                className="mx-2 h-px bg-border/70 first:hidden"
              />
            ) : (
              <div className="eyebrow px-2 pb-1">{group.label}</div>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                const link = (
                  <Link
                    href={item.href}
                    aria-label={showCollapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center rounded-md text-sm font-medium text-muted-foreground outline-none transition-colors",
                      "hover:bg-accent hover:text-foreground",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      showCollapsed
                        ? "h-9 w-9 justify-center"
                        : "gap-2.5 px-2 py-1.5",
                      active && [
                        "bg-accent text-foreground",
                        // Hot rail accent — appears on the left edge of the active row.
                        "before:absolute before:top-1.5 before:bottom-1.5 before:w-[2px] before:rounded-r-full before:bg-hot",
                        showCollapsed ? "before:left-0" : "before:left-0",
                      ],
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        active
                          ? "text-foreground"
                          : "text-muted-foreground/80 group-hover:text-foreground",
                      )}
                      strokeWidth={1.5}
                      aria-hidden
                    />
                    {!showCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
                return (
                  <li key={item.href}>
                    {showCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8}>
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ─── Footer: Settings + collapse toggle ─── */}
      <div
        className={cn(
          "shrink-0 border-t border-border/70",
          showCollapsed ? "space-y-1 px-2 py-3" : "space-y-1 px-3 py-3",
        )}
      >
        {showCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/parametres"
                aria-label="Paramètres"
                aria-current={pathname.startsWith("/parametres") ? "page" : undefined}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors",
                  "hover:bg-accent hover:text-foreground",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  pathname.startsWith("/parametres") && "bg-accent text-foreground",
                )}
              >
                <Settings className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Paramètres
            </TooltipContent>
          </Tooltip>
        ) : (
          <Link
            href="/parametres"
            aria-current={pathname.startsWith("/parametres") ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground outline-none transition-colors",
              "hover:bg-accent hover:text-foreground",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              pathname.startsWith("/parametres") && "bg-accent text-foreground",
            )}
          >
            <Settings className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
            <span className="truncate">Paramètres</span>
          </Link>
        )}

        {isDesktop && (
          showCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  aria-label="Déplier la barre latérale"
                  aria-expanded={false}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors",
                    "hover:bg-accent hover:text-foreground",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  )}
                >
                  <PanelLeftOpen className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                Déplier
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="Replier la barre latérale"
              aria-expanded={true}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground outline-none transition-colors",
                "hover:bg-accent hover:text-foreground",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              )}
            >
              <PanelLeftClose className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />
              <span className="truncate">Replier</span>
            </button>
          )
        )}
      </div>
    </aside>
  );
}
