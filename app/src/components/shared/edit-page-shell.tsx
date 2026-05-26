import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { BackLink } from "@/components/shared/back-link";

interface EditPageShellProps {
  /** Where the back-link points (e.g. `/clients/abc`). */
  backHref: string;
  /** Label shown after the back chevron (e.g. "Retour à la fiche client"). */
  backLabel: ReactNode;
  /** Page eyebrow — small uppercase context, e.g. "Client · Édition". */
  eyebrow?: ReactNode;
  /** Main page title (entity name, invoice number, etc.). */
  title: string;
  /** Optional description shown under the title. */
  description?: ReactNode;
  /** Constrain the inner column. Defaults to `max-w-3xl` to match the form
   *  layouts; pass `max-w-5xl` for invoice/quote pages with line tables. */
  maxWidth?: "max-w-3xl" | "max-w-5xl" | "max-w-4xl" | "max-w-2xl";
  /** The actual form / page content. */
  children: ReactNode;
  className?: string;
}

/** Layout shell shared by every entity edit page (e.g. `clients/[id]/edit`).
 *  Wraps the back-link + page header so each edit page collapses to ~10 lines
 *  and stays visually consistent. */
export function EditPageShell({
  backHref,
  backLabel,
  eyebrow,
  title,
  description,
  maxWidth = "max-w-3xl",
  children,
  className,
}: EditPageShellProps) {
  return (
    <div className={cn("mx-auto", maxWidth, className)}>
      <BackLink href={backHref}>{backLabel}</BackLink>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      {children}
    </div>
  );
}
