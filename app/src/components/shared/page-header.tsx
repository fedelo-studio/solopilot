import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: ReactNode;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/* Canonical page header for the app shell.
 * Eyebrow uses the Fedelo "hot rail" pattern; the t-h1 class lives in
 * globals.css so the typographic ramp stays in one place. */
export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="space-y-3">
        {eyebrow ? (
          <div className="eyebrow eyebrow-led flex items-center">{eyebrow}</div>
        ) : null}
        <h1 className="t-h1">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
