import type { CompanySettings } from "@/types/domain";

/** Mock company settings used when `NEXT_PUBLIC_DATA_MODE=mock`.
 *  Mutable: the onboarding wizard and /parametres form patch this object via
 *  `updateMockCompany`. The exported `mockCompany` constant is the same
 *  object reference, mutated in place. */
const _company: CompanySettings = {
  id: "company-fedelo",
  userId: "user-felipe",
  companyName: "Fedelo Studio",
  ownerName: "Felipe",
  defaultCurrency: "CHF",
  defaultVatRate: 8.1,
  reservePercent: 25,
  iban: "CH00 0000 0000 0000 0000 0",
  invoiceFooter: "Conditions de paiement : 30 jours.",
};

export const mockCompany = _company;

/** Patch the mock company object in place. Used by `updateCompanySettings` in
 *  mock mode so the onboarding wizard actually persists (which then lets
 *  `isOnboarded()` flip to true and the user leave /bienvenue). */
export function updateMockCompany(patch: Partial<CompanySettings>): CompanySettings {
  Object.assign(_company, patch);
  return _company;
}
