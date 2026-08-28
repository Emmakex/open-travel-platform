import { expect, test, type Browser } from "@playwright/test";

const customerEmail = "accessibility-operator-customer@example.test";
const customerPassword = "Accessibility-Operator-Customer-2026";
const adminEmail = process.env.KTRAVEL_BOOTSTRAP_ADMIN_EMAIL || "accessibility-operator-admin@example.test";
const adminPassword = process.env.KTRAVEL_BOOTSTRAP_ADMIN_PASSWORD || "Accessibility-Operator-Admin-2026";

async function createPersistentReservation(browser: Browser) {
  const customerContext = await browser.newContext();
  const page = await customerContext.newPage();

  await page.goto("/account/register");
  await page.locator('input[name="firstName"]').fill("Accessible");
  await page.locator('input[name="lastName"]').fill("Operator Customer");
  await page.locator('input[name="email"]').fill(customerEmail);
  await page.locator('input[name="country"]').fill("Spain");
  await page.locator('input[name="password"]').fill(customerPassword);
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/\/account(?:\?created=1)?$/);

  await page.goto("/trips/barcelona-city-break/book");
  const removeButtons = page.getByRole("button", { name: /Remove|Eliminar/i });
  if (await removeButtons.count()) await removeButtons.first().click();
  await page.locator('input[name="travellerFirstName__traveller-1"]').fill("Accessible");
  await page.locator('input[name="travellerLastName__traveller-1"]').fill("Traveller");
  await page.locator('input[name="travellerDateOfBirth__traveller-1"]').fill("1990-01-15");
  await page.locator('input[name="travellerNationality__traveller-1"]').fill("Spanish");
  await page.locator('form button[type="submit"]').last().click();
  await expect(page).toHaveURL(/\/account\/reservations\/res-[^/?]+(?:\?.*)?$/);

  const reservationId = new URL(page.url()).pathname.split("/").filter(Boolean).at(-1);
  expect(reservationId).toMatch(/^res-/);
  if (!reservationId) throw new Error("Reservation ID missing from customer detail URL.");

  await customerContext.close();
  return reservationId;
}

test("Operator workflow exposes accessible feedback, form names and error relationships", async ({ browser }) => {
  const reservationId = await createPersistentReservation(browser);
  const adminContext = await browser.newContext();
  const page = await adminContext.newPage();

  await page.goto("/operator/sign-in");
  await page.locator('input[name="email"]').fill(adminEmail);
  await page.locator('input[name="password"]').fill(adminPassword);
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/\/operator(?:\?.*)?$/);

  const query = new URLSearchParams({
    operationsUpdated: "workflow",
    operationsError: "invalid-tags",
    taskUpdated: "created",
    taskError: "invalid-task",
    fulfilmentUpdated: "saved",
    fulfilmentError: "invalid-cost"
  });
  await page.goto(`/operator/reservations/${encodeURIComponent(reservationId)}/workflow?${query.toString()}`);

  await expect(page.locator("#internal-workflow")).toBeVisible();
  await expect(page.locator("#tasks")).toBeVisible();
  await expect(page.locator("#fulfilment")).toBeVisible();

  await expect(page.locator("#operations-status")).toHaveAttribute("role", "status");
  await expect(page.locator("#operations-status")).toHaveAttribute("aria-live", "polite");
  await expect(page.locator("#operations-error")).toHaveAttribute("role", "alert");
  await expect(page.locator("#operations-error")).toHaveAttribute("aria-live", "assertive");
  await expect(page.locator('input[name="tags"]')).toHaveAttribute("aria-invalid", "true");

  // PR #115 regression guard: Operator copy is localized, so browser expectations must not depend on one language.
  const workflowForm = page.getByRole("form", { name: /^(Reservation internal workflow|Gestión interna de la reserva)$/i });
  await expect(workflowForm).toHaveAttribute("aria-describedby", "operations-error");

  await expect(page.locator("#tasks-status")).toHaveAttribute("role", "status");
  await expect(page.locator("#tasks-error")).toHaveAttribute("role", "alert");
  const createTaskForm = page.getByRole("form", { name: /^(Create internal task|Crear tarea interna)$/i });
  await expect(createTaskForm).toBeVisible();
  await expect(page.locator('input[name="title"]')).toHaveAttribute("aria-invalid", "true");

  await expect(page.locator("#fulfilment-status")).toHaveAttribute("role", "status");
  await expect(page.locator("#fulfilment-error")).toHaveAttribute("role", "alert");
  const supplierForm = page.getByRole("form", { name: /^(Supplier tracking for|Seguimiento de proveedor para) /i }).first();
  if (await supplierForm.count()) {
    await expect(supplierForm.locator('input[name="supplierCost"]')).toHaveAttribute("aria-invalid", "true");
  }

  await adminContext.close();
});
