import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { getCompanySettings, isOnboarded } from "@/lib/data";
import { OnboardingWizard } from "./wizard";

export default async function BienvenuePage() {
  const settings = await getCompanySettings();
  // If the user has already set up their workspace, the wizard isn't useful —
  // bounce them to the dashboard.
  if (isOnboarded(settings)) {
    redirect("/dashboard");
  }
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Premier lancement"
        title="Bienvenue dans SoloPilot"
        description="Trois étapes rapides pour configurer ton cockpit. Tu peux tout sauter et y revenir depuis les Paramètres."
      />
      <OnboardingWizard initial={settings} />
    </div>
  );
}
