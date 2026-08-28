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
  await page.getByRole("button", { name: "Create my account" }).click();
  await expect(page).toHaveURL(/\/account\?created=1$/);

  await page.goto("/trips/barcelona-city-break/book");
  await page.getByRole("button", { name: "Remove" }).click();
  await page.locator('input[name="travellerFirstName__traveller-1"]').fill("Accessible");
  await page.locator('input[name="travellerLastName__traveller-1"]').fill("Traveller");
  await page.locator('input[name="travellerDateOfBirth__traveller-1"]').fill("1990-01-15");
  await page.locator('input[name="travellerNationality__traveller-1"]').fill("Spanish");
  await page.getByRole("button", { name: "Confirm reservation" }).click();
  await expect(page).toHaveURL(/\/account\/reservations\/res-[^/?]+$/);

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
  await page.getByRole("button", { name: "Sign in to operations" }).click();
  await expect(page).toHaveURL(/\/operator$/);

  const query = new URLSearchParams({
    operationsUpdated: "workflow",
    operationsError: "invalid-tags",
    taskUpdated: "created",
    taskError: "invalid-task",
    fulfilmentUpdated: "saved",
    fulfilmentError: "invalid-cost"
  });
  await page.goto(`/operator/reservations/${encodeURIComponent(reservationId)}/workflow?${query.toString()}`);

  await expect(page.getByRole("heading", { name: "Barcelona City Break" })).toBeVisible();

  await expect(page.locator("#operations-status")).toHaveAttribute("role", "status");
  await expect(page.locator("#operations-status")).toHaveAttribute("aria-live", "polite");
  await expect(page.locator("#operations-error")).toHaveAttribute("role", "alert");
  await expect(page.locator("#operations-error")).toHaveAttribute("aria-live", "assertive");
  await expect(page.locator('input[name="tags"]')).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("form", { name: "Reservation internal workflow" })).toHaveAttribute("aria-describedby", "operations-error");

  await expect(page.locator("#tasks-status")).toHaveAttribute("role", "status");
  await expect(page.locator("#tasks-error")).toHaveAttribute("role", "alert");
  await expect(page.getByRole("form", { name: "Create internal task" })).toBeVisible();
  await expect(page.locator('input[name="title"]')).toHaveAttribute("aria-invalid", "true");

  await expect(page.locator("#fulfilment-status")).toHaveAttribute("role", "status");
  await expect(page.locator("#fulfilment-error")).toHaveAttribute("role", "alert");
  const supplierForm = page.locator('form[aria-label^="Supplier tracking for "]').first();
  await expect(supplierForm).toBeVisible();
  await expect(supplierForm.locator('input[name="supplierCost"]')).toHaveAttribute("aria-invalid", "true");

  await adminContext.close();
});