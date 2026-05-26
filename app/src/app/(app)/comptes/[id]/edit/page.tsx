import { notFound } from "next/navigation";
import { EditPageShell } from "@/components/shared/edit-page-shell";
import { getAccountById } from "@/lib/data";
import { AccountForm } from "@/components/accounts/account-form";

export default async function EditAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await getAccountById(id);
  if (!account) notFound();
  return (
    <EditPageShell
      backHref="/comptes"
      backLabel="Retour aux comptes"
      eyebrow="Compte · Édition"
      title={account.name}
      description="Modifie le nom, le type, le solde initial."
    >
      <AccountForm account={account} />
    </EditPageShell>
  );
}
