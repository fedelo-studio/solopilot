import { PageHeader } from "@/components/shared/page-header";
import { AccountForm } from "@/components/accounts/account-form";

export default function NewAccountPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Finances · Nouveau compte"
        title="Ajouter un compte"
        description="Compte bancaire, espèces ou épargne — pour suivre ton cash réel."
      />
      <AccountForm />
    </div>
  );
}
