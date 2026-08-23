import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const uiRoots = ["app", "components"];
const sourceExtensions = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const findings = [];

const forbiddenPublicMarkers = [
  {
    pattern: /\b(?:Phase|Fase)\s+\d+[A-Za-z]?(?:[.-]\d+)?\b/i,
    message: "internal roadmap/phase marker in user-facing source"
  },
  {
    pattern: /\bPR\s*#\d+\b/i,
    message: "pull-request reference in user-facing source"
  },
  {
    pattern: /["'`]([^"'`\n]{0,100})\b(?:WIP|TODO|FIXME)\b([^"'`\n]{0,100})["'`]/i,
    message: "unfinished-work marker in visible copy"
  }
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

for (const root of uiRoots) {
  let files = [];
  try {
    files = await walk(root);
  } catch {
    continue;
  }

  for (const file of files) {
    const content = await readFile(file, "utf8");
    for (const check of forbiddenPublicMarkers) {
      if (check.pattern.test(content)) {
        findings.push(`${file}: ${check.message}`);
      }
    }
  }
}

if (findings.length) {
  console.error("UX/public-copy quality gate failed:\n");
  findings.forEach((finding) => console.error(`- ${finding}`));
  console.error("\nMove internal development notes to docs, issues or PR descriptions. Public UI copy must describe the product, not the development process.");
  process.exit(1);
}

console.log("UX/public-copy automated checks passed.");
console.log("Manual PR gate still required for visible changes: desktop/mobile layout, hierarchy, controls, states, copy and accessibility must be visually reviewed before merge.");
