/**
 * SoloPilot — Edge function `invoice-reminders`
 *
 * Cible : tourner tous les jours à 9h (Europe/Zurich) via `pg_cron` ou un scheduler externe.
 *
 * Ce que ça fait :
 *   1. Trouve les factures `sent` dont la `due_date` est passée et qui n'ont pas été
 *      relancées depuis au moins `MIN_REMINDER_INTERVAL_DAYS`.
 *   2. Pour chacune : stamp `last_reminded_at = now()`, crée une alerte (severity = danger),
 *      et appelle l'intégration email du choix (Resend / Postmark / SES — à brancher).
 *   3. Retourne un résumé JSON pour le scheduler.
 *
 * Déploiement :
 *   supabase functions deploy invoice-reminders --no-verify-jwt
 *
 * Planification (option A — pg_cron, recommandée) :
 *   select cron.schedule(
 *     'invoice-reminders-daily',
 *     '0 7 * * *',   -- 09:00 Zurich en heure d'hiver, 09:00 en heure d'été (07h UTC)
 *     $$
 *       select net.http_post(
 *         url := 'https://einqhjrrxtjvrqpcmxkl.supabase.co/functions/v1/invoice-reminders',
 *         headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.cron_token'))
 *       );
 *     $$
 *   );
 *
 * Planification (option B) : appel HTTP planifié depuis Vercel Cron / GitHub Actions / etc.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MIN_REMINDER_INTERVAL_DAYS = 7;

interface InvoiceRow {
  id: string;
  user_id: string;
  number: string;
  total: number;
  amount_paid: number;
  due_date: string;
  last_reminded_at: string | null;
  client_id: string;
}

interface ClientRow {
  id: string;
  name: string;
  email: string | null;
}

Deno.serve(async (req) => {
  // Optional bearer-token auth for cron jobs. The function is deployed
  // with --no-verify-jwt so anyone can call it; we gate access here via
  // CRON_TOKEN. Set this in Supabase project secrets.
  const expectedToken = Deno.env.get("CRON_TOKEN");
  if (expectedToken) {
    const provided = req.headers.get("authorization")?.replace(/^Bearer /, "");
    if (provided !== expectedToken) {
      return json({ error: "unauthorized" }, 401);
    }
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const today = new Date();
  const todayISO = today.toISOString().slice(0, 10);

  // 1. Fetch overdue invoices not reminded recently.
  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("id, user_id, number, total, amount_paid, due_date, last_reminded_at, client_id")
    .eq("status", "sent")
    .lt("due_date", todayISO);

  if (error) return json({ error: error.message }, 500);

  const candidates = (invoices ?? []).filter((inv: InvoiceRow) => {
    const balance = Number(inv.total) - Number(inv.amount_paid);
    if (balance <= 0) return false;
    if (!inv.last_reminded_at) return true;
    const ageDays = (today.getTime() - new Date(inv.last_reminded_at).getTime()) / 86_400_000;
    return ageDays >= MIN_REMINDER_INTERVAL_DAYS;
  });

  if (candidates.length === 0) {
    return json({ ok: true, reminded: 0, message: "Aucune facture à relancer aujourd'hui." });
  }

  // 2. Fetch the linked clients (batched).
  const clientIds = [...new Set(candidates.map((i: InvoiceRow) => i.client_id))];
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, email")
    .in("id", clientIds);
  const clientById = new Map((clients ?? []).map((c: ClientRow) => [c.id, c]));

  // 3. Process each candidate: stamp last_reminded_at, insert alert, send email.
  let remindedCount = 0;
  for (const inv of candidates as InvoiceRow[]) {
    const balance = Number(inv.total) - Number(inv.amount_paid);
    const client = clientById.get(inv.client_id);

    // Stamp the timestamp.
    await supabase
      .from("invoices")
      .update({ last_reminded_at: new Date().toISOString() })
      .eq("id", inv.id);

    // Insert/refresh an alert.
    await supabase.from("alerts").insert({
      user_id: inv.user_id,
      type: "invoice_overdue",
      severity: "danger",
      title: `Relance auto — facture ${inv.number}`,
      body: `${client?.name ?? "Client"} — ${balance.toFixed(2)} CHF dus, échéance ${inv.due_date}.`,
      related_type: "invoice",
      related_id: inv.id,
    });

    // 4. Send email — placeholder. Plug your provider here (Resend, Postmark, SES, etc.).
    //
    // Example with Resend:
    //   await fetch("https://api.resend.com/emails", {
    //     method: "POST",
    //     headers: {
    //       "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       from: "factures@fedelo.studio",
    //       to: client?.email,
    //       subject: `Rappel — facture ${inv.number}`,
    //       html: `<p>Bonjour, ...</p>`,
    //     }),
    //   });

    remindedCount++;
  }

  return json({ ok: true, reminded: remindedCount });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
