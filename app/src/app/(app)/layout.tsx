import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { KeyboardNav } from "@/components/layout/keyboard-nav";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getCompanySettings } from "@/lib/data";

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const settings = await getCompanySettings();

  return (
    <TooltipProvider delayDuration={200}>
      <KeyboardNav />
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col overflow-x-hidden">
          <Topbar companyName={settings.companyName} ownerName={settings.ownerName} />
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
