import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const uiRoots = ["app", "components"];
const sourceExtensions = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const findings = [];

const forbiddenEverywhere = [
  { pattern: /\b(?:Phase|Fase)\s+\d+[A-Za-z]?(?:[.-]\d+)?\b/i, message: "internal roadmap/phase marker in user-facing source" },
  { pattern: /\bPR\s*#\d+\b/i, message: "pull-request reference in user-facing source" },
  { pattern: /\b(?:WIP|TODO|FIXME)\b/, message: "unfinished-work marker in user-facing source" }
];

const forbiddenCustomerCopy = [
  { pattern: /\bsource of truth\b|\bfuente de verdad\b/i, message: "architecture language exposed to customers" },
  { pattern: /\bpayment ledger\b|\bledger de pagos\b/i, message: "finance implementation language exposed to customers" },
  { pattern: /\bpersistent inventory\b|\binventario persistente\b/i, message: "storage/inventory implementation language exposed to customers" },
  { pattern: /\bserver notification\b|\bnotificaci[oó]n verificada del servidor\b/i, message: "server implementation language exposed to customers" },
  { pattern: /\bin this deployment\b|\ben este despliegue\b/i, message: "deployment language exposed to customers" },
  { pattern: /review (?:the )?server logs|revisa (?:los )?logs del servidor/i, message: "developer instruction exposed in product UI" },
  { pattern: /title\s*:\s*["'`][^"'`\n]*\|\s*Kairoseth Travel["'`]/i, message: "page title includes brand even though root metadata already appends it" }
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (sourceExtensions.has(extname(entry.name))) files.push(path);
  }
  return files;
}

function isCustomerFacing(file) {
  return !file.startsWith("app/operator/") && !file.startsWith("components/operator/");
}

for (const root of uiRoots) {
  let files = [];
  try { files = await walk(root); } catch { continue; }

  for (const file of files) {
    const content = await readFile(file, "utf8");
    for (const check of forbiddenEverywhere) {
      if (check.pattern.test(content)) findings.push(`${file}: ${check.message}`);
    }
    if (isCustomerFacing(file)) {
      for (const check of forbiddenCustomerCopy) {
        if (check.pattern.test(content)) findings.push(`${file}: ${check.message}`);
      }
    }
  }
}

if (findings.length) {
  console.error("UX/public-copy quality gate failed:\n");
  findings.forEach((finding) => console.error(`- ${finding}`));
  console.error("\nMove internal development context to docs, issues or PR descriptions. Customer-facing UI should explain the task and outcome, not the implementation.");
  process.exit(1);
}

console.log("UX/public-copy automated checks passed.");
console.log("Manual PR gate still required for visible changes: desktop/mobile layout, hierarchy, controls, states, copy and accessibility must be visually reviewed before merge.");
