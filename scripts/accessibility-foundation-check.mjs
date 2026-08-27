import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`Accessibility-foundation invariant failed: ${message}`);
};

const layout = read("app/layout.tsx");
const styles = read("app/accessibility.css");
const header = read("components/site-header.tsx");
const browserTest = read("tests/e2e/accessibility-smoke.spec.ts");
const docs = read("docs/ACCESSIBILITY-BASELINE.md");
const docsEs = read("docs/ACCESSIBILITY-BASELINE.es.md");
const packageJson = JSON.parse(read("package.json"));

assert(layout.includes('className="skip-link"'), "root layout must expose a keyboard skip link");
assert(layout.includes('href="#main-content"'), "skip link must target the stable main-content focus target");
assert(layout.includes('id="main-content"'), "root layout must expose the main-content target");
assert(layout.includes("tabIndex={-1}"), "main-content target must accept programmatic/fragment focus without entering normal tab order");
assert(layout.includes("<html lang={locale}>"), "document language must remain locale-aware");
assert(layout.includes('import "./accessibility.css"'), "accessibility styles must be loaded globally");

assert(styles.includes(".skip-link:focus-visible"), "skip link must become visible on keyboard focus");
for (const selector of ["a:focus-visible", "button:focus-visible", "input:focus-visible", "select:focus-visible", "textarea:focus-visible", "summary:focus-visible"]) {
  assert(styles.includes(selector), `visible focus styling must cover ${selector}`);
}
assert(styles.includes("outline: 3px solid var(--accent)"), "focus indicator must use an explicit visible outline");
assert(styles.includes("prefers-reduced-motion: reduce"), "global styles must respect reduced-motion preference");
assert(styles.includes("forced-colors: active"), "focus treatment must preserve forced-colors support");
assert(styles.includes("scroll-behavior: auto"), "reduced-motion mode must disable smooth scrolling");

assert(header.includes("aria-label={locale === \"es\" ? \"Navegación principal\" : \"Primary navigation\"}"), "desktop primary navigation must retain an accessible name");
assert(header.includes("aria-label={locale === \"es\" ? \"Navegación móvil\" : \"Mobile navigation\"}"), "mobile navigation must retain an accessible name");

for (const evidence of [
  "keyboard users can bypass navigation and retain visible focus",
  "desktop navigation exposes an accessible name",
  "reduced-motion preference disables smooth scrolling and long transitions",
  "homepage does not create horizontal page overflow at 320px"
]) {
  assert(browserTest.includes(evidence), `browser accessibility smoke must prove: ${evidence}`);
}
assert(browserTest.includes('toHaveURL(/#main-content$/)'), "browser test must activate the skip target rather than only inspect markup");
assert(browserTest.includes("toBeFocused()"), "browser test must prove focus movement");
assert(browserTest.includes("outlineWidth"), "browser test must inspect a visible focus indicator");

for (const [name, text] of [["English", docs], ["Spanish", docsEs]]) {
  const lower = text.toLowerCase();
  assert(lower.includes("w3.org/tr/wcag22"), `${name} docs must cite official WCAG 2.2`);
  assert(lower.includes("2019/882"), `${name} docs must cite the European Accessibility Act directive`);
  assert(lower.includes("boe-a-2023-11022"), `${name} docs must cite Spain Ley 11/2023`);
  assert(lower.includes("28 june 2025") || lower.includes("28 de junio de 2025"), `${name} docs must record the Spanish Title I effective date`);
  assert(lower.includes("microenterprises") || lower.includes("microempresas"), `${name} docs must preserve the deployment-scope exception boundary`);
  assert(lower.includes("not legal advice") || lower.includes("no es asesoramiento jurídico"), `${name} docs must avoid claiming legal certification`);
  assert(lower.includes("manual") && lower.includes("keyboard"), `${name} docs must retain an explicit human-review gate`);
}

assert(packageJson.scripts?.["check:accessibility-foundation"] === "node scripts/accessibility-foundation-check.mjs", "accessibility static gate must be registered");
assert(packageJson.scripts?.["test:accessibility-smoke"] === "playwright test tests/e2e/accessibility-smoke.spec.ts --project=chromium", "accessibility browser smoke must be registered");
assert(packageJson.scripts?.verify?.includes("check:accessibility-foundation"), "accessibility static gate must be part of verify");

console.log("Accessibility skip-navigation, visible-focus, reduced-motion, reflow and documentation invariants passed.");
