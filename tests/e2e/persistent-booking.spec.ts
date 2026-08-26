import { expect, test } from "@playwright/test";

const customerEmail = "browser-e2e-customer@example.test";
const customerPassword = "Browser-E2E-Customer-2026";
const adminEmail = process.env.KTRAVEL_BOOTSTRAP_ADMIN_EMAIL || "browser-e2e-admin@example.test";
const adminPassword = process.env.KTRAVEL_BOOTSTRAP_ADMIN_PASSWORD || "Browser-E2E-Admin-2026";

test("registered customer booking is visible to persistent admin", async ({ browser }) => {
  const customerContext = await browser.newContext();
  const customerPage = await customerContext.newPage();

  await customerPage.goto("/account/register");
  await expect(customerPage.getByRole("heading", { name: "Start your next journey." })).toBeVisible();
  await customerPage.locator('input[name="firstName"]').fill("Browser");
  await customerPage.locator('input[name="lastName"]').fill("Customer");
  await customerPage.locator('input[name="email"]').fill(customerEmail);
  await customerPage.locator('input[name="country"]').fill("Spain");
  await customerPage.locator('input[name="password"]').fill(customerPassword);
  await customerPage.getByRole("button", { name: "Create my account" }).click();
  await expect(customerPage).toHaveURL(/\/account\?created=1$/);

  await customerPage.goto("/trips/barcelona-city-break/book");
  await expect(customerPage.getByRole("heading", { name: "Barcelona City Break" })).toBeVisible();
  await expect(customerPage.locator('select[name="availabilityId"]')).toHaveValue("departure-e2e-barcelona");

  await customerPage.getByRole("button", { name: "Remove" }).click();
  await customerPage.locator('input[name="travellerFirstName__traveller-1"]').fill("Browser");
  await customerPage.locator('input[name="travellerLastName__traveller-1"]').fill("Traveller");
  await customerPage.locator('input[name="travellerDateOfBirth__traveller-1"]').fill("1990-01-15");
  await customerPage.locator('input[name="travellerNationality__traveller-1"]').fill("Spanish");

  const confirm = customerPage.getByRole("button", { name: "Confirm reservation" });
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(customerPage).toHaveURL(/\/account\/reservations\/res-[^/?]+$/);

  const customerReservationUrl = new URL(customerPage.url());
  const reservationId = customerReservationUrl.pathname.split("/").filter(Boolean).at(-1);
  expect(reservationId).toMatch(/^res-/);
  if (!reservationId) throw new Error("Reservation ID missing from customer detail URL.");

  await expect(customerPage.getByRole("heading", { name: "Barcelona City Break" })).toBeVisible();
  await expect(customerPage.getByText(reservationId, { exact: true })).toBeVisible();
  await expect(customerPage.getByText("Browser Traveller", { exact: false })).toBeVisible();
  await expect(customerPage.getByText("pending", { exact: true })).toBeVisible();

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await adminPage.goto("/operator/sign-in");
  await expect(adminPage.getByRole("heading", { name: "Operations sign in." })).toBeVisible();
  await adminPage.locator('input[name="email"]').fill(adminEmail);
  await adminPage.locator('input[name="password"]').fill(adminPassword);
  await adminPage.getByRole("button", { name: "Sign in to operations" }).click();
  await expect(adminPage).toHaveURL(/\/operator$/);

  await adminPage.goto(`/operator/reservations/${encodeURIComponent(reservationId)}`);
  await expect(adminPage).toHaveURL(new RegExp(`/operator/reservations/${reservationId}$`));
  await expect(adminPage.getByRole("heading", { name: "Barcelona City Break" })).toBeVisible();
  await expect(adminPage.getByText(reservationId, { exact: true })).toBeVisible();
  await expect(adminPage.getByText("Browser Traveller", { exact: false })).toBeVisible();
  await expect(adminPage.getByText("pending", { exact: true })).toBeVisible();

  await adminContext.close();
  await customerContext.close();
});
