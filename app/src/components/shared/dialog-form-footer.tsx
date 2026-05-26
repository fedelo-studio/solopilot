import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";

interface DialogFormFooterProps {
  /** `useTransition` pending flag — disables both buttons. */
  pending: boolean;
  /** Label shown on the primary button when idle (e.g. "Créer le client"). */
  submitLabel: string;
  /** Label shown on the primary button while `pending` (e.g. "Création…"). */
  pendingLabel: string;
  /** Override the cancel label. Defaults to "Annuler". */
  cancelLabel?: string;
  /** Extra condition to disable the submit button (beyond `pending`). */
  disableSubmit?: boolean;
  /** Submit button variant — defaults to primary. */
  submitVariant?: "default" | "destructive" | "hot";
  /** When provided, the primary button is `type="button"` and calls `onSubmit`
   *  on click — useful for dialogs that don't wrap their action in a `<form>`
   *  (e.g. quote → invoice conversion). When omitted, the button is
   *  `type="submit"` and relies on the surrounding form. */
  onSubmit?: () => void;
}

/** Footer shared by every modal-form dialog: cancel-on-close + primary
 *  submit-with-pending-label. Removes the
 *  `<DialogClose asChild><Button ghost>Annuler</Button></DialogClose>` +
 *  `<Button type="submit" disabled>{pending ? "…" : "Save"}</Button>` block
 *  that was duplicated across 6 dialogs. */
export function DialogFormFooter({
  pending,
  submitLabel,
  pendingLabel,
  cancelLabel = "Annuler",
  disableSubmit = false,
  submitVariant = "default",
  onSubmit,
}: DialogFormFooterProps) {
  return (
    <DialogFooter>
      <DialogClose asChild>
        <Button type="button" variant="ghost" disabled={pending}>
          {cancelLabel}
        </Button>
      </DialogClose>
      {onSubmit ? (
        <Button
          type="button"
          variant={submitVariant}
          onClick={onSubmit}
          disabled={pending || disableSubmit}
        >
          {pending ? pendingLabel : submitLabel}
        </Button>
      ) : (
        <Button type="submit" variant={submitVariant} disabled={pending || disableSubmit}>
          {pending ? pendingLabel : submitLabel}
        </Button>
      )}
    </DialogFooter>
  );
}
