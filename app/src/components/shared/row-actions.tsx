"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2, ExternalLink, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface RowActionItem {
  label: string;
  href?: string;
  onSelect?: () => void | Promise<void>;
  icon?: LucideIcon;
  variant?: "default" | "danger";
}

interface RowActionsProps {
  /** Where the "View" item navigates (if provided). */
  viewHref?: string;
  /** Where the "Edit" item navigates (if provided). */
  editHref?: string;
  /** Async delete handler — wrapped in a confirm dialog. */
  onDelete?: () => Promise<{ ok: boolean; error?: string }>;
  /** Human label used in the confirm prompt — "Supprimer ce client ?" */
  deleteLabel?: string;
  /** Extra actions inserted between "Edit" and "Delete". */
  extraItems?: RowActionItem[];
  /** Override the trigger button (defaults to a small "…" icon). */
  triggerLabel?: string;
}

/** Compact "…" dropdown for any table row, kanban card, or detail header.
 *  Handles view / edit / delete-with-confirm out of the box. */
export function RowActions({
  viewHref,
  editHref,
  onDelete,
  deleteLabel = "cet élément",
  extraItems,
  triggerLabel = "Plus d'actions",
}: RowActionsProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!onDelete) return;
    setError(null);
    startTransition(async () => {
      const result = await onDelete();
      if (result.ok) {
        setConfirmOpen(false);
        router.refresh();
      } else {
        setError(result.error ?? "Suppression impossible");
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label={triggerLabel}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {viewHref ? (
            <DropdownMenuItem asChild>
              <Link href={viewHref}>
                <ExternalLink className="h-3.5 w-3.5" />
                Voir
              </Link>
            </DropdownMenuItem>
          ) : null}
          {editHref ? (
            <DropdownMenuItem asChild>
              <Link href={editHref}>
                <Pencil className="h-3.5 w-3.5" />
                Modifier
              </Link>
            </DropdownMenuItem>
          ) : null}
          {extraItems?.map((item) => {
            const Icon = item.icon;
            const Inner = (
              <>
                {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                {item.label}
              </>
            );
            return item.href ? (
              <DropdownMenuItem asChild key={item.label}>
                <Link href={item.href}>{Inner}</Link>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                key={item.label}
                onSelect={() => {
                  void item.onSelect?.();
                }}
                className={item.variant === "danger" ? "text-danger focus:text-danger" : undefined}
              >
                {Inner}
              </DropdownMenuItem>
            );
          })}
          {onDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-danger focus:text-danger focus:bg-danger-soft"
                onSelect={(e) => {
                  e.preventDefault();
                  setConfirmOpen(true);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {onDelete ? (
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Supprimer {deleteLabel} ?</DialogTitle>
              <DialogDescription>
                Cette action est définitive. Les éléments liés peuvent être impactés.
              </DialogDescription>
            </DialogHeader>
            {error ? <p className="text-xs text-danger">{error}</p> : null}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={pending}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={pending}>
                {pending ? "Suppression…" : "Supprimer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
