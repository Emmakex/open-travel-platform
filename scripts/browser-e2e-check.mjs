import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`Browser E2E invariant failed: ${message}`);
};

const packageJson = JSON.parse(read("package.json"));
const config = read("playwright.config.ts");
const seed = read("tests/e2e/seed.ts");
const journey = read("tests/e2e/persistent-booking.spec.ts");
const workflow = read(".github/workflows/ci.yml");

assert(packageJson.devDependencies?.["@playwright/test"] === "1.62.1", "Playwright Test must remain exactly pinned to the reviewed stable version");
assert(packageJson.scripts?.["test:e2e"] === "playwright test", "package script must execute Playwright");
assert(packageJson.scripts?.["test:e2e:seed"] === "tsx tests/e2e/seed.ts", "package script must expose the protected Mongo E2E seed");
assert(config.includes('baseURL: process.env.PLAYWRIGHT_BASE_URL?.trim() || "http://localhost:3000"'), "browser test must use the controlled localhost application origin");
assert(config.includes('command: "npm start"'), "browser E2E must run the production Next.js server rather than next dev");
assert(config.includes('name: "chromium"'), "Chromium project must be configured explicitly");
assert(seed.includes('databaseName.startsWith("ktravel_ci_")'), "destructive E2E seed must require a CI-only database name");
assert(seed.includes('parsed.hostname === "127.0.0.1"') && seed.includes('parsed.hostname === "localhost"'), "destructive E2E seed must reject remote MongoDB hosts");
assert(seed.includes("seedDemoCatalogueToMongo"), "E2E seed must reuse the supported catalogue seeding path");
assert(seed.includes('replaceMongoTripDepartures("trip-barcelona-city"'), "E2E seed must create a controlled bookable departure");
assert(journey.includes('goto("/account/register")'), "journey must register a customer through the browser");
assert(journey.includes('name: "Create my account"'), "journey must submit persistent customer registration");
assert(journey.includes('goto("/trips/barcelona-city-break/book")'), "journey must open the real trip booking UI");
assert(journey.includes('name: "Confirm reservation"'), "journey must create the reservation through the browser form");
assert(journey.includes('goto("/operator/sign-in")'), "journey must authenticate staff through the browser");
assert(journey.includes('name: "Sign in to operations"'), "journey must submit persistent staff authentication");
assert(journey.includes("/operator/reservations/"), "journey must verify the same reservation in Operator");
assert(workflow.includes("browser-e2e:"), "CI must contain a dedicated browser E2E job");
assert(workflow.includes("npx playwright install --with-deps chromium"), "CI must install the pinned Chromium runtime");
assert(workflow.includes("npm run test:e2e:seed"), "CI must seed the disposable Mongo database before browser E2E");
assert(workflow.includes("npm run test:e2e"), "CI must execute the Playwright journey");
assert(workflow.includes("IDENTITY_MODE: mongodb") && workflow.includes("STAFF_AUTH_MODE: mongodb"), "browser E2E must use persistent customer and staff identity");
assert(workflow.includes("BOOKING_MODE: mongodb") && workflow.includes("OPERATIONS_MODE: mongodb"), "browser E2E must use persistent booking and operations repositories");

console.log("Persistent browser registration, booking and Operator E2E invariants passed.");
