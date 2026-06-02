import { expect, test } from "@playwright/test";

/** Smoke tests — visit each top-level page and assert the page heading.
 *  These run against mock data (the dev server runs in mock mode unless
 *  .env.local provides Supabase credentials and DATA_MODE=live).
 *  In live mode, redirect-to-login is expected; we accept either case. */

const PAGES: Array<{ path: string; heading: RegExp; allowLogin?: boolean }> = [
  { path: "/dashboard", heading: /Bonjour/i, allowLogin: true },
  { path: "/pipeline", heading: /Pipeline/i, allowLogin: true },
  { path: "/clients", heading: /Clients/i, allowLogin: true },
  { path: "/projets", heading: /Projets/i, allowLogin: true },
  { path: "/factures", heading: /Factures/i, allowLogin: true },
  { path: "/depenses", heading: /Dépenses/i, allowLogin: true },
  { path: "/budgets", heading: /Budgets/i, allowLogin: true },
  { path: "/cashflow", heading: /Cashflow/i, allowLogin: true },
  { path: "/comptes", heading: /Comptes/i, allowLogin: true },
  { path: "/parametres", heading: /Paramètres/i, allowLogin: true },
];

for (const { path, heading, allowLogin } of PAGES) {
  test(`page ${path} loads`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.ok()).toBeTruthy();
    // If middleware redirected us to /login, the test still passes as a smoke check.
    if (allowLogin && page.url().endsWith("/login")) {
      await expect(page.getByText(/Se connecter|Lien magique/i)).toBeVisible();
    } else {
      await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
    }
  });
}

test("dashboard surfaces the four key metrics", async ({ page }) => {
  const response = await page.goto("/dashboard");
  expect(response?.ok()).toBeTruthy();
  if (page.url().endsWith("/login")) {
    test.skip(true, "requires authenticated session");
  }
  await expect(page.getByText("Cash disponible")).toBeVisible();
  await expect(page.getByText("Pipeline pondéré")).toBeVisible();
  await expect(page.getByText("Factures à encaisser")).toBeVisible();
  await expect(page.getByText("Dépenses ce mois")).toBeVisible();
});

test("clicking 'Nouveau client' opens the dialog", async ({ page }) => {
  await page.goto("/clients");
  if (page.url().endsWith("/login")) test.skip(true, "requires authenticated session");
  await page.getByRole("button", { name: /Nouveau client/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByLabel("Nom")).toBeVisible();
});

test("creating an invoice flow renders the form", async ({ page }) => {
  await page.goto("/factures/nouvelle");
  if (page.url().endsWith("/login")) test.skip(true, "requires authenticated session");
  await expect(page.getByText(/Créer une facture/i)).toBeVisible();
  await expect(page.getByText(/Sous-total/i)).toBeVisible();
  await expect(page.getByText(/Total TTC/i)).toBeVisible();
});
