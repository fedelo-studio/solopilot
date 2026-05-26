"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FormActionsProps {
  /** `useTransition` pending flag — disables both buttons. */
  pending: boolean;
  /** Label shown on the primary submit button when idle. Defaults to "Enregistrer". */
  submitLabel?: string;
  /** Label shown on the primary submit button while pending. Defaults to "Enregistrement…". */
  pendingLabel?: string;
  /** Label shown on the secondary cancel button. Defaults to "Annuler". */
  cancelLabel?: string;
  /** Custom cancel handler. Defaults to `router.back()`. */
  onCancel?: () => void;
  /** Hide the cancel button entirely (e.g. in modal forms). */
  hideCancel?: boolean;
  /** Submit button variant — defaults to the standard primary. */
  submitVariant?: "default" | "destructive";
  className?: string;
}

/** Trailing button row shared by every standalone form.
 *  Removes the `flex justify-end gap-2` + cancel + submit duplication
 *  from ~13 form components. */
export function FormActions({
  pending,
  submitLabel = "Enregistrer",
  pendingLabel = "Enregistrement…",
  cancelLabel = "Annuler",
  onCancel,
  hideCancel = false,
  submitVariant = "default",
  className,
}: FormActionsProps) {
  const router = useRouter();
  return (
    <div className={cn("flex justify-end gap-2", className)}>
      {hideCancel ? null : (
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel ?? (() => router.back())}
          disabled={pending}
        >
          {cancelLabel}
        </Button>
      )}
      <Button type="submit" variant={submitVariant} disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </div>
  );
}
