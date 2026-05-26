import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { BrandMark } from "./brand-mark";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** Use the SoloPilot brand mark instead of a generic icon. */
  branded?: boolean;
  /** `default` = page/card empty; `sm` = inline empty (pipeline column, drawer section). */
  size?: "default" | "sm";
}

/* Single source of truth for empty states.
 * Use `size="sm"` inside pipeline columns, drawer sections, or any context
 * where the page-scale empty state would feel oversized. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  branded = false,
  size = "default",
}: EmptyStateProps) {
  const isSm = size === "sm";
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border/80 bg-card/30 text-center",
        isSm ? "gap-2 px-4 py-6" : "gap-4 px-6 py-16",
        className,
      )}
    >
      {branded ? (
        <div className="opacity-50 transition-opacity duration-300 hover:opacity-100 motion-reduce:transition-none">
          <BrandMark size={isSm ? 24 : 36} variant="compact" />
        </div>
      ) : Icon ? (
        <div
          className={cn(
            "rounded-full bg-muted text-muted-foreground",
            isSm ? "p-2" : "p-3",
          )}
        >
          <Icon className={isSm ? "h-4 w-4" : "h-5 w-5"} strokeWidth={1.5} aria-hidden />
        </div>
      ) : null}
      <div className={isSm ? "space-y-0.5" : "space-y-1.5"}>
        <h3 className={cn("font-medium", isSm ? "text-sm" : "text-base")}>{title}</h3>
        {description ? (
          <p
            className={cn(
              "mx-auto max-w-sm text-muted-foreground",
              isSm ? "text-xs" : "text-sm",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className={isSm ? "mt-0.5" : "mt-1"}>{action}</div> : null}
    </div>
  );
}
