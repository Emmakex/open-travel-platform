import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import ts from "typescript";

const roots = ["app", "components"];
const extraFiles = [
  "lib/i18n.ts",
  "lib/account-i18n.ts",
  "lib/operator-i18n.ts",
  "lib/payment-i18n.ts"
];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx"]);
const outDir = "audit-output";

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (extensions.has(extname(entry.name))) files.push(path);
  }
  return files;
}

function lineOf(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function normalize(value) {
  return value.replace(/\s+/g, " ").trim();
}

function isLikelyCopy(value) {
  if (!value || value.length < 2) return false;
  if (/^(?:[A-Za-z0-9_.:/@\-\[\]]+)$/.test(value) && !/[A-Z][a-z]{2,}/.test(value)) return false;
  if (/^(?:https?:\/\/|@\/|\.\/|\.\.\/)/.test(value)) return false;
  if (/^(?:button|main|section|article|div|span|strong|small|form|input|select|option|label|p|h[1-6]|dl|dt|dd|ul|li)$/i.test(value)) return false;
  if (/^[a-z0-9_-]+$/.test(value) && !value.includes(" ")) return false;
  return /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(value);
}

const files = [];
for (const root of roots) {
  try { files.push(...(await walk(root))); } catch {}
}
for (const file of extraFiles) {
  try { await readFile(file, "utf8"); files.push(file); } catch {}
}

const entries = [];
for (const file of Array.from(new Set(files)).sort()) {
  const content = await readFile(file, "utf8");
  const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

  function push(value, node, kind) {
    const text = normalize(value);
    if (!isLikelyCopy(text)) return;
    entries.push({ file: relative(".", file), line: lineOf(sourceFile, node), kind, text });
  }

  function visit(node) {
    if (ts.isJsxText(node)) push(node.getText(sourceFile), node, "jsx-text");
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (!ts.isImportDeclaration(node.parent) && !ts.isExportDeclaration(node.parent)) {
        push(node.text, node, "string");
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
}

const technicalPatterns = [
  ["development marker", /\b(?:phase|fase|slice|roadmap|pull request|\bPR\s*#?\d+|WIP|TODO|FIXME)\b/i],
  ["deployment language", /\b(?:deployment|despliegue|configured|configurado|configuration|configuración)\b/i],
  ["architecture language", /\b(?:source of truth|fuente de verdad|provider-neutral|adapter|ledger|server notification|notificación.*servidor|inventory|inventario)\b/i],
  ["security implementation language", /\b(?:encryption|encrypted|cifrado|cifrada|AES|key|clave del servidor)\b/i],
  ["temporary/unfinished language", /\b(?:temporarily|temporalmente|currently unavailable|no está disponible actualmente|check back later|consulta más adelante)\b/i]
];

const flagged = entries.flatMap((entry) => technicalPatterns
  .filter(([, pattern]) => pattern.test(entry.text))
  .map(([category]) => ({ ...entry, category }))
);

const duplicates = Object.entries(entries.reduce((map, entry) => {
  const key = entry.text.toLocaleLowerCase();
  map[key] ??= [];
  map[key].push(entry);
  return map;
}, {})).filter(([, items]) => items.length >= 3).map(([text, items]) => ({ text, count: items.length, locations: items.slice(0, 12) }));

await mkdir(outDir, { recursive: true });
await writeFile(`${outDir}/static-copy.json`, JSON.stringify({ generatedAt: new Date().toISOString(), total: entries.length, entries, flagged, duplicates }, null, 2));

const byFile = Object.entries(entries.reduce((map, entry) => {
  map[entry.file] = (map[entry.file] ?? 0) + 1;
  return map;
}, {})).sort((a, b) => b[1] - a[1]);

const markdown = [
  "# Static UI copy inventory",
  "",
  `Potential copy strings: **${entries.length}**`,
  `Flagged for editorial review: **${flagged.length}**`,
  `Files containing potential copy: **${byFile.length}**`,
  "",
  "## Files by copy volume",
  "",
  ...byFile.map(([file, count]) => `- ${file}: ${count}`),
  "",
  "## Editorial flags",
  "",
  ...flagged.map((item) => `- **${item.category}** — ${item.file}:${item.line} — ${item.text}`),
  ""
].join("\n");
await writeFile(`${outDir}/static-copy.md`, markdown);
console.log(`Static copy inventory complete: ${entries.length} strings, ${flagged.length} editorial flags.`);