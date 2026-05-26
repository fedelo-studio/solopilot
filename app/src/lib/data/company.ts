import "server-only";
import { isLive } from "./_mode";
import { createServerSupabase } from "@/lib/supabase/server";
import { mockCompany } from "@/lib/mock";
import type { CompanySettings, Currency } from "@/types/domain";

function rowToCompany(row: Record<string, unknown>): CompanySettings {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    companyName: row.company_name as string,
    ownerName: row.owner_name as string,
    defaultCurrency: (row.default_currency as Currency) ?? "CHF",
    defaultVatRate: Number(row.default_vat_rate),
    reservePercent: Number(row.reserve_percent),
    iban: (row.iban as string) ?? undefined,
    invoiceFooter: (row.invoice_footer as string) ?? undefined,
  };
}

/** Crude heuristic — onboarding is "done" once the user has changed the default
 *  company name set by the auth trigger ('Mon studio'). This lets us redirect
 *  first-time users to /bienvenue without forcing a dedicated flag column. */
export function isOnboarded(settings: CompanySettings): boolean {
  return settings.companyName.trim() !== "" && settings.companyName !== "Mon studio";
}

export async function getCompanySettings(): Promise<CompanySettings> {
  if (!isLive) return mockCompany;
  const supabase = await createServerSupabase();
  if (!supabase) return mockCompany;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return mockCompany;
  const { data, error } = await supabase
    .from("company_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToCompany(data) : mockCompany;
}
