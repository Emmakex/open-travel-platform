import { expect, test } from "@playwright/test";

const customerPassword = "Accessibility-Booking-Payment-2026";

async function registerCustomer(page: import("@playwright/test").Page) {
  await page.goto("/account/register");
  await page.locator("#register-first-name").fill("Accessible");
  await page.locator("#register-last-name").fill("Checkout");
  await page.locator("#register-email").fill("accessibility-booking-payment@example.test");
  await page.locator("#register-country").fill("Spain");
  await page.locator("#register-password").fill(customerPassword);
  await page.getByRole("button", { name: /Create my account|Crear mi cuenta/i }).click();
  await expect(page).toHaveURL(/\/account\?created=1$/);
}

async function createReservation(page: import("@playwright/test").Page) {
  await page.goto("/trips/barcelona-city-break/book");
  await expect(page.locator('select[name="availabilityId"]')).toHaveValue("departure-e2e-barcelona");
  await page.getByRole("button", { name: /Remove|Eliminar/i }).click();
  await page.locator('input[name="travellerFirstName__traveller-1"]').fill("Accessible");
  await page.locator('input[name="travellerLastName__traveller-1"]').fill("Traveller");
  await page.locator('input[name="travellerDateOfBirth__traveller-1"]').fill("1990-01-15");
  await page.locator('input[name="travellerNationality__traveller-1"]').fill("Spanish");
  await page.getByRole("button", { name: /Confirm reservation|Confirmar reserva/i }).click();
  await expect(page).toHaveURL(/\/account\/reservations\/res-[^/?]+$/);
  const reservationId = new URL(page.url()).pathname.split("/").filter(Boolean).at(-1);
  if (!reservationId) throw new Error("Reservation ID missing from customer detail URL.");
  return reservationId;
}

test.describe("booking and payment accessibility", () => {
  test("trip booking server feedback is exposed as an assertive alert", async ({ page }) => {
    await page.goto("/trips/barcelona-city-break/book?error=invalid-travellers");
    const error = page.locator("#trip-booking-error");
    await expect(error).toBeVisible();
    await expect(error).toHaveAttribute("role", "alert");
    await expect(error).toHaveAttribute("aria-live", "assertive");
  });

  test("authenticated checkout exposes payment errors, summary and current state", async ({ page }) => {
    await registerCustomer(page);
    const reservationId = await createReservation(page);

    await page.goto(`/account/checkout/trip/${encodeURIComponent(reservationId)}?error=provider-error`);
    const error = page.locator("#checkout-error");
    await expect(error).toBeVisible();
    await expect(error).toHaveAttribute("role", "alert");
    await expect(error).toHaveAttribute("aria-live", "assertive");
    await expect(page.locator('dl[aria-label="Payment summary"]')).toBeVisible();
    await expect(page.locator("#checkout-state")).toHaveAttribute("role", "status");
    await expect(page.locator("#checkout-state")).toHaveAttribute("aria-live", "polite");
  });
});
