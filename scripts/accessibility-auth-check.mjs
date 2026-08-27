import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`Accessible-auth invariant failed: ${message}`);
};

const signIn = read("app/account/sign-in/page.tsx");
const register = read("app/account/register/page.tsx");
const forgot = read("app/account/forgot-password/page.tsx");
const reset = read("app/account/reset-password/page.tsx");
const css = read("app/account/account.module.css");
const browser = read("tests/e2e/accessibility-auth.spec.ts");
const docs = read("docs/ACCESSIBILITY-BASELINE.md");
const docsEs = read("docs/ACCESSIBILITY-BASELINE.es.md");
const packageJson = JSON.parse(read("package.json"));

for (const [name, source] of [["sign-in", signIn], ["registration", register], ["recovery", forgot], ["reset", reset]]) {
  assert(source.includes('role="alert"'), `${name} must expose failure feedback through an alert region`);
  assert(source.includes("aria-invalid"), `${name} must expose invalid field state where applicable`);
  assert(source.includes("aria-describedby"), `${name} must associate fields/forms with help or error text`);
  assert(source.includes("autoFocus"), `${name} must move initial focus to the actionable invalid field for returned validation failures`);
}

assert(signIn.includes('role="status"') && signIn.includes('aria-live="polite"'), "sign-in success feedback must use a polite status region");
assert(forgot.includes('role="status"') && forgot.includes('aria-live="polite"'), "password-recovery success feedback must use a polite status region");
assert(register.includes('id="register-password-help"'), "registration password instructions must have a stable programmatic description id");
assert(reset.includes('id="reset-password-length"'), "reset password instructions must have a stable programmatic description id");
assert(css.includes('input[aria-invalid="true"]'), "invalid account controls must have a visual state in addition to semantic aria-invalid");

for (const evidence of [
  "sign-in associates invalid credentials",
  "registration exposes email-exists feedback",
  "password reset exposes instructions",
  "password recovery distinguishes polite success",
  "password reset success is exposed as a polite status"
]) {
  assert(browser.includes(evidence), `blocking browser coverage must include: ${evidence}`);
}

for (const [name, text] of [["English", docs], ["Spanish", docsEs]]) {
  const lower = text.toLowerCase();
  assert(lower.includes("authentication") || lower.includes("autenticación"), `${name} accessibility docs must cover authentication forms`);
  assert(lower.includes("aria-invalid"), `${name} accessibility docs must document invalid-field semantics`);
  assert(lower.includes("aria-describedby"), `${name} accessibility docs must document field/help relationships`);
  assert(lower.includes("role=\"alert\"") || lower.includes("role `alert`") || lower.includes("role=alert"), `${name} accessibility docs must document assertive error feedback`);
}

assert(packageJson.scripts?.["check:accessibility-auth"] === "node scripts/accessibility-auth-check.mjs", "accessible-auth static gate must be registered");
assert(packageJson.scripts?.["test:accessibility-auth"] === "playwright test tests/e2e/accessibility-auth.spec.ts --project=chromium", "accessible-auth browser test must be registered");
assert(packageJson.scripts?.verify?.includes("check:accessibility-auth"), "accessible-auth invariant must be part of verify");

console.log("Accessible customer authentication form invariants passed.");
