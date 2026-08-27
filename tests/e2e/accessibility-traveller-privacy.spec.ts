import { expect, test } from "@playwright/test";
import { MongoClient } from "mongodb";

const customerPassword = "Accessibility-Customer-2026";

async function registerCustomer(page: import("@playwright/test").Page, email: string) {
  await page.goto("/account/register");
  await page.locator("#register-first-name").fill("Accessible");
  await page.locator("#register-last-name").fill("Customer");
  await page.locator("#register-email").fill(email);
  await page.locator("#register-country").fill("Spain");
  await page.locator("#register-password").fill(customerPassword);
  await page.getByRole("button", { name: /Create my account|Crear mi cuenta/i }).click();
  await expect(page).toHaveURL(/\/account\?created=1$/);
}

async function createBarcelonaReservation(page: import("@playwright/test").Page) {
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

async function prepareTravellerRequirements(reservationId: string) {
  const uri = process.env.MONGODB_URI;
  const databaseName = process.env.MONGODB_DB_NAME;
  if (!uri || !databaseName) throw new Error("MongoDB test configuration is missing.");

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const reservations = client.db(databaseName).collection("travel_reservations");
    const reservation = await reservations.findOne({ id: reservationId });
    if (!reservation) throw new Error(`Reservation ${reservationId} was not found.`);
    const travellerId = reservation.travellers?.[0]?.id;
    if (typeof travellerId !== "string" || !travellerId) throw new Error("Traveller ID missing from persisted reservation.");

    await reservations.updateOne(
      { id: reservationId },
      {
        $set: {
          travellerRequirements: {
            preset: "travel-document",
            requiredFields: ["documentType", "documentNumber", "documentIssuingCountry", "documentExpiryDate"],
            retentionDaysAfterEnd: 30
          }
        }
      }
    );
    return travellerId;
  } finally {
    await client.close();
  }
}

test.describe("Traveller Data and privacy accessibility", () => {
  test("Traveller Data returns focus and programmatic error context to the affected traveller", async ({ page }) => {
    await registerCustomer(page, "accessibility-traveller@example.test");
    const reservationId = await createBarcelonaReservation(page);
    const travellerId = await prepareTravellerRequirements(reservationId);

    await page.goto(`/account/traveller-data/trip/${encodeURIComponent(reservationId)}?error=validation&traveller=${encodeURIComponent(travellerId)}`);

    const error = page.locator("#traveller-data-error");
    await expect(error).toBeVisible();
    await expect(error).toHaveAttribute("role", "alert");
    await expect(error).toHaveAttribute("aria-live", "assertive");

    const firstField = page.locator("#traveller-0-documentType");
    await expect(firstField).toBeFocused();
    await expect(firstField).toHaveAttribute("aria-invalid", "true");
    await expect(firstField).toHaveAttribute("aria-describedby", "traveller-data-error");
    await expect(page.getByRole("status").first()).toBeVisible();

    await page.goto(`/account/traveller-data/trip/${encodeURIComponent(reservationId)}?saved=${encodeURIComponent(travellerId)}`);
    const saved = page.locator("#traveller-saved-0");
    await expect(saved).toBeVisible();
    await expect(saved).toHaveAttribute("role", "status");
    await expect(saved).toHaveAttribute("aria-live", "polite");
  });

  test("privacy request feedback and repeated case actions expose meaningful accessible names", async ({ page }) => {
    await registerCustomer(page, "accessibility-privacy@example.test");
    await page.goto("/account/privacy");

    const right = page.locator("#privacy-right-type");
    await expect(right).toHaveAttribute("aria-describedby", "privacy-right-help");

    await right.selectOption("access");
    await page.getByRole("button", { name: /Submit request|Enviar solicitud/i }).click();
    await expect(page.locator("#privacy-request-status")).toBeVisible();
    await expect(page.locator("#privacy-request-status")).toHaveAttribute("role", "status");

    await right.selectOption("rectification");
    await page.getByRole("button", { name: /Submit request|Enviar solicitud/i }).click();
    await expect(page.locator("#privacy-request-status")).toBeVisible();

    await expect(page.getByRole("button", { name: /Withdraw Access request|Retirar solicitud de Acceso/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Withdraw Rectification request|Retirar solicitud de Rectificación/i })).toBeVisible();

    await page.goto("/account/privacy?error=invalid-type");
    const error = page.locator("#privacy-request-error");
    await expect(error).toBeVisible();
    await expect(error).toHaveAttribute("role", "alert");
    await expect(error).toHaveAttribute("aria-live", "assertive");
    await expect(page.locator("#privacy-right-type")).toBeFocused();
    await expect(page.locator("#privacy-right-type")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#privacy-right-type")).toHaveAttribute("aria-describedby", /privacy-right-help/);
    await expect(page.locator("#privacy-right-type")).toHaveAttribute("aria-describedby", /privacy-request-error/);
  });
});
