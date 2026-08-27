import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`Traveller/privacy accessibility invariant failed: ${message}`);
};

const actions = read("app/account/traveller-data/actions.ts");
const traveller = read("app/account/traveller-data/[targetType]/[id]/page.tsx");
const privacy = read("app/account/privacy/page.tsx");
const browser = read("tests/e2e/accessibility-traveller-privacy.spec.ts");
const docs = read("docs/ACCESSIBILITY-TRAVELLER-PRIVACY.md");
const docsEs = read("docs/ACCESSIBILITY-TRAVELLER-PRIVACY.es.md");
const packageJson = JSON.parse(read("package.json"));

assert(actions.includes("function errorUrl"), "traveller errors must use a bounded contextual URL builder");
assert(actions.includes('params.set("traveller", travellerId)'), "traveller validation errors must preserve the existing technical traveller ID");
assert(traveller.includes('id="traveller-data-error"'), "Traveller Data must expose a stable error region");
assert(traveller.includes('role="alert"') && traveller.includes('aria-live="assertive"'), "Traveller Data failures must be announced assertively");
assert(traveller.includes('role="status"') && traveller.includes('aria-live="polite"'), "Traveller Data progress/save state must be exposed politely");
assert(traveller.includes("htmlFor={inputId}"), "Traveller Data controls must have explicit label associations");
assert(traveller.includes('"aria-invalid": invalid || undefined'), "Traveller Data invalid fields must expose semantic invalid state");
assert(traveller.includes('"aria-describedby": describedBy'), "Traveller Data fields must expose error descriptions");
assert(traveller.includes("autoFocus={validationError && fieldIndex === 0}"), "Traveller Data must focus the first field of the affected traveller");

for (const id of ["privacy-request-status", "privacy-withdraw-status", "privacy-request-error", "privacy-right-type", "privacy-right-help"]) {
  assert(privacy.includes(id), `privacy workflow must keep stable ${id} semantics`);
}
assert(privacy.includes('role="alert"') && privacy.includes('aria-live="assertive"'), "privacy failures must be announced assertively");
assert(privacy.includes('role="status"') && privacy.includes('aria-live="polite"'), "privacy confirmations must be exposed politely");
assert(privacy.includes("Withdraw ${right} request") && privacy.includes("Download approved JSON for ${right}"), "repeated privacy actions must have contextual accessible names");

for (const evidence of [
  "Traveller Data returns focus",
  "privacy request feedback and repeated case actions"
]) {
  assert(browser.includes(evidence), `blocking browser coverage must include: ${evidence}`);
}

for (const [name, text] of [["English", docs], ["Spanish", docsEs]]) {
  const lower = text.toLowerCase();
  assert(lower.includes("traveller data"), `${name} docs must cover Traveller Data`);
  assert(lower.includes("aria-invalid"), `${name} docs must document invalid-field semantics`);
  assert(lower.includes("aria-describedby"), `${name} docs must document error/help relationships`);
  assert(lower.includes("privacy") || lower.includes("privacidad"), `${name} docs must cover privacy workflows`);
  assert(lower.includes("role=\"alert\"") && lower.includes("role=\"status\""), `${name} docs must document alert/status semantics`);
}

assert(packageJson.scripts?.["check:accessibility-traveller-privacy"] === "node scripts/accessibility-traveller-privacy-check.mjs", "static gate must be registered");
assert(packageJson.scripts?.["test:accessibility-traveller-privacy"] === "playwright test tests/e2e/accessibility-traveller-privacy.spec.ts --project=chromium", "browser gate must be registered");
assert(packageJson.scripts?.verify?.includes("check:accessibility-traveller-privacy"), "static gate must be part of verify");

console.log("Traveller Data and privacy accessibility invariants passed.");
