"use server";

import { z } from "zod";
import {
  fail,
  getAuthedSession,
  ok,
  parseFormData,
  revalidateMany,
  type ActionResult,
} from "./_helpers";
import { updateMockCompany } from "@/lib/mock/company";

const CompanyUpdateSchema = z.object({
  companyName: z.string().trim().min(1, "Le nom de l'entreprise est requis"),
  ownerName: z.string().trim().min(1, "Le nom du propriétaire est requis"),
  defaultVatRate: z.coerce.number().min(0).max(100),
  reservePercent: z.coerce.number().min(0).max(100),
  iban: z.string().optional(),
  invoiceFooter: z.string().optional(),
});

export async function updateCompanySettings(formData: FormData): Promise<ActionResult> {
  const parsed = parseFormData(CompanyUpdateSchema, formData);
  if (!parsed.success) return fail("Validation échouée", parsed.fields);

  const session = await getAuthedSession();
  if (!session.ok) return fail(session.error);

  if (session.session.mode === "mock") {
    updateMockCompany({
      companyName: parsed.data.companyName,
      ownerName: parsed.data.ownerName,
      defaultVatRate: parsed.data.defaultVatRate,
      reservePercent: parsed.data.reservePercent,
      iban: parsed.data.iban || undefined,
      invoiceFooter: parsed.data.invoiceFooter || undefined,
    });
    revalidateMany(["/parametres", "/dashboard", "/bienvenue", "/factures/nouvelle"]);
    return ok(null);
  }

  const { userId, supabase } = session.session;
  // Upsert by user_id (unique constraint in the schema).
  const { error } = await supabase
    .from("company_settings")
    .upsert(
      {
        user_id: userId,
        company_name: parsed.data.companyName,
        owner_name: parsed.data.ownerName,
        default_vat_rate: parsed.data.defaultVatRate,
        reserve_percent: parsed.data.reservePercent,
        iban: parsed.data.iban || null,
        invoice_footer: parsed.data.invoiceFooter || null,
      },
      { onConflict: "user_id" },
    );

  if (error) return fail(error.message);
  revalidateMany(["/parametres", "/factures/nouvelle"]);
  return ok(null);
}
