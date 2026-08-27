import { expect, test } from "@playwright/test";

test.describe("accessible customer authentication forms", () => {
  test("sign-in associates invalid credentials with both fields and moves focus", async ({ page }) => {
    await page.goto("/account/sign-in?error=invalid-credentials");

    const alert = page.locator("#sign-in-error");
    await expect(alert).toBeVisible();
    await expect(alert).toHaveAttribute("role", "alert");
    await expect(alert).toHaveAttribute("aria-live", "assertive");

    const email = page.getByLabel("Email");
    const password = page.getByLabel(/Password|Contraseña/i);
    await expect(email).toBeFocused();
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(password).toHaveAttribute("aria-invalid", "true");
    await expect(email).toHaveAttribute("aria-describedby", "sign-in-error");
    await expect(password).toHaveAttribute("aria-describedby", "sign-in-error");
  });

  test("registration exposes email-exists feedback and preserves password help", async ({ page }) => {
    await page.goto("/account/register?error=email-exists");

    const alert = page.locator("#registration-error");
    await expect(alert).toBeVisible();
    await expect(alert).toHaveAttribute("role", "alert");
    await expect(alert).toHaveAttribute("aria-live", "assertive");

    const email = page.getByLabel("Email");
    const password = page.getByLabel(/Password|Contraseña/i);
    await expect(email).toBeFocused();
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(email).toHaveAttribute("aria-describedby", "registration-error");
    await expect(password).toHaveAttribute("aria-describedby", /register-password-help/);
  });

  test("password reset exposes instructions and validation error relationships", async ({ page }) => {
    await page.goto("/account/reset-password?token=test-token&error=validation");

    const alert = page.locator("#reset-password-error");
    await expect(alert).toBeVisible();
    await expect(alert).toHaveAttribute("role", "alert");
    await expect(alert).toHaveAttribute("aria-live", "assertive");

    const password = page.locator("#reset-password");
    const confirmation = page.locator("#reset-password-confirmation");
    await expect(password).toBeFocused();
    await expect(password).toHaveAttribute("aria-invalid", "true");
    await expect(confirmation).toHaveAttribute("aria-invalid", "true");
    await expect(password).toHaveAttribute("aria-describedby", /reset-password-length/);
    await expect(password).toHaveAttribute("aria-describedby", /reset-password-error/);
    await expect(confirmation).toHaveAttribute("aria-describedby", "reset-password-error");
  });

  test("password recovery distinguishes polite success from assertive delivery failure", async ({ page }) => {
    await page.goto("/account/forgot-password?sent=1");
    const success = page.locator("#password-recovery-status");
    await expect(success).toBeVisible();
    await expect(success).toHaveAttribute("role", "status");
    await expect(success).toHaveAttribute("aria-live", "polite");
    await expect(page.getByLabel("Email")).toHaveAttribute("aria-describedby", "password-recovery-help");

    await page.goto("/account/forgot-password?error=delivery-failed");
    const alert = page.locator("#password-recovery-error");
    await expect(alert).toBeVisible();
    await expect(alert).toHaveAttribute("role", "alert");
    await expect(alert).toHaveAttribute("aria-live", "assertive");
    const email = page.getByLabel("Email");
    await expect(email).toBeFocused();
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(email).toHaveAttribute("aria-describedby", "password-recovery-error");
  });

  test("password reset success is exposed as a polite status on sign-in", async ({ page }) => {
    await page.goto("/account/sign-in?reset=success");
    const status = page.locator("#sign-in-status");
    await expect(status).toBeVisible();
    await expect(status).toHaveAttribute("role", "status");
    await expect(status).toHaveAttribute("aria-live", "polite");
  });
});
