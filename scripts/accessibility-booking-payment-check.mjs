import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`Booking/payment accessibility invariant failed: ${message}`);
};

const trip = read("app/trips/[slug]/book/page.tsx");
const travellerForm = read("components/traveller-booking-form.tsx");
const service = read("app/services/book/[type]/[slug]/page.tsx");
const checkout = read("app/account/checkout/[targetType]/[id]/page.tsx");
const checkoutReturn = read("app/account/checkout/return/page.tsx");
const redsys = read("app/account/checkout/redsys/[checkoutId]/page.tsx");
const browser = read("tests/e2e/accessibility-booking-payment.spec.ts");
const docs = read("docs/ACCESSIBILITY-BOOKING-PAYMENT.md");
const docsEs = read("docs/ACCESSIBILITY-BOOKING-PAYMENT.es.md");
const packageJson = JSON.parse(read("package.json"));

assert(trip.includes('id="trip-booking-error"'), "trip booking must keep a stable error region");
assert(trip.includes('role="alert"') && trip.includes('aria-live="assertive"'), "trip booking errors must be announced assertively");
assert(travellerForm.includes("validateTravellerFields"), "trip booking must preserve explicit traveller field recovery");
assert(travellerForm.includes('id="trip-booking-field-errors"') && travellerForm.includes('aria-atomic="true"'), "field recovery must keep a stable atomic error summary");
assert(travellerForm.includes("aria-invalid={") && travellerForm.includes("aria-describedby={"), "invalid traveller controls must be associated with inline errors");
assert(travellerForm.includes("control.focus()"), "field recovery must move focus to the first invalid traveller control");
assert(travellerForm.includes("noValidate") && travellerForm.includes("onSubmit={handleSubmit}"), "client recovery must run deterministically before server submission");
assert(service.includes('id="service-booking-error"'), "service booking must keep a stable error region");
assert(service.includes('role="alert"') && service.includes('aria-live="assertive"'), "service booking errors must be announced assertively");

for (const id of ["checkout-error", "checkout-plan-status", "checkout-state"]) {
  assert(checkout.includes(id), `checkout must keep stable ${id} semantics`);
}
assert(checkout.includes('role="alert"') && checkout.includes('aria-live="assertive"'), "checkout failures must be assertive alerts");
assert(checkout.includes('role="status"') && checkout.includes('aria-live="polite"'), "checkout non-error states must be polite statuses");
assert(checkout.includes('aria-label={t("Payment summary", "Resumen de pago")}'), "payment summary must have an accessible name");
assert(checkout.includes('aria-label={t("Available payment methods", "Métodos de pago disponibles")}'), "payment methods must have an accessible name");

assert(checkoutReturn.includes('id="checkout-return-status"'), "provider return must keep a stable status region");
assert(checkoutReturn.includes('const liveRole = order.status === "failed" ? "alert" : "status"'), "failed returns must use alert severity");
assert(checkoutReturn.includes('aria-live={liveMode}') && checkoutReturn.includes('aria-atomic="true"'), "provider return must be live and atomic");
assert(redsys.includes('id="redsys-handoff-status"') && redsys.includes('role="status"') && redsys.includes('aria-live="polite"'), "Redsys handoff must expose polite redirect status");

for (const evidence of [
  "trip booking server feedback is exposed as an assertive alert",
  "trip booking exposes inline traveller errors and focuses the first invalid field",
  "authenticated checkout exposes payment errors, summary and current state"
]) {
  assert(browser.includes(evidence), `blocking browser coverage must include: ${evidence}`);
}

for (const [name, text] of [["English", docs], ["Spanish", docsEs]]) {
  const lower = text.toLowerCase();
  assert(lower.includes("booking") || lower.includes("reserva"), `${name} docs must cover booking feedback`);
  assert(lower.includes("checkout"), `${name} docs must cover checkout`);
  assert(lower.includes('role="alert"') && lower.includes('role="status"'), `${name} docs must document alert/status semantics`);
  assert(lower.includes("aria-invalid") && lower.includes("focus"), `${name} docs must document field errors and focus recovery`);
  assert(lower.includes("redsys") && lower.includes("stripe"), `${name} docs must preserve provider boundary`);
}

assert(packageJson.scripts?.["check:accessibility-booking-payment"] === "node scripts/accessibility-booking-payment-check.mjs", "static gate must be registered");
assert(packageJson.scripts?.["test:accessibility-booking-payment"] === "playwright test tests/e2e/accessibility-booking-payment.spec.ts --project=chromium", "browser gate must be registered");
assert(packageJson.scripts?.verify?.includes("check:accessibility-booking-payment"), "static gate must be part of verify");

console.log("Booking and payment accessibility invariants passed.");
