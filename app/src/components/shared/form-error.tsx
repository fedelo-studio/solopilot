import { cn } from "@/lib/utils";

interface FormErrorProps {
  /** Error message to display, or `null`/`undefined` to render nothing. */
  message: string | null | undefined;
  /** Override default size — defaults to `text-sm` (matches form footers). */
  size?: "xs" | "sm";
  className?: string;
}

/** Inline error message rendered above the submit row of a form.
 *  Returns `null` when there is no message — safe to drop anywhere. */
export function FormError({ message, size = "sm", className }: FormErrorProps) {
  if (!message) return null;
  return (
    <p
      className={cn(
        "text-danger",
        size === "xs" ? "text-xs" : "text-sm",
        className,
      )}
      role="alert"
    >
      {message}
    </p>
  );
}
