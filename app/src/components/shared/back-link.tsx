import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackLinkProps {
  /** Destination URL (e.g. `/clients/123`). */
  href: string;
  /** Visible label after the chevron (e.g. "Retour à la fiche client"). */
  children: React.ReactNode;
  className?: string;
}

/** Compact back-link used at the top of edit/detail pages.
 *  Centralises the chevron + muted typography that was previously
 *  copy-pasted across ~15 pages. */
export function BackLink({ href, children, className }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      <ChevronLeft className="h-3 w-3" />
      {children}
    </Link>
  );
}
