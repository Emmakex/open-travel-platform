import { mkdir, writeFile } from "node:fs/promises";

const base = new URL(process.env.AUDIT_BASE_URL || "https://travel.kairoseth.com");
const startPaths = ["/", "/destinations", "/trips", "/activities", "/transport", "/insurance"];
const allowedPrefixes = ["/destinations", "/trips", "/activities", "/transport", "/insurance", "/services/book"];
const maxPages = 100;
const queue = [...startPaths];
const visited = new Set();
const pages = [];

function decode(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function visibleText(html) {
  return decode(html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim());
}

function title(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? visibleText(match[1]) : "";
}

function links(html) {
  const out = new Set();
  for (const match of html.matchAll(/href=["']([^"'#]+)(?:#[^"']*)?["']/gi)) {
    try {
      const url = new URL(match[1], base);
      if (url.origin !== base.origin) continue;
      const path = url.pathname.replace(/\/$/, "") || "/";
      if (startPaths.includes(path) || allowedPrefixes.some((prefix) => path.startsWith(`${prefix}/`))) out.add(path);
    } catch {}
  }
  return [...out];
}

function editorialFlags(text) {
  const checks = [
    ["development", /\b(?:Phase|Fase)\s+\d+|\bPR\s*#?\d+|\bWIP\b|\bTODO\b|\bFIXME\b/i],
    ["technical", /\b(?:source of truth|fuente de verdad|provider-neutral|adapter|ledger|server notification|notificación verificada al servidor|deployment|despliegue)\b/i],
    ["implementation security", /\b(?:AES-256|encryption key|clave de cifrado|storage is not configured|almacenamiento.*no está configurado)\b/i],
    ["unfinished", /\b(?:check back later|consulta más adelante|while new options are added|mientras incorporamos nuevas opciones)\b/i]
  ];
  return checks.filter(([, regex]) => regex.test(text)).map(([name]) => name);
}

while (queue.length && visited.size < maxPages) {
  const path = queue.shift();
  if (visited.has(path)) continue;
  visited.add(path);
  const url = new URL(path, base);
  try {
    const response = await fetch(url, { redirect: "follow", headers: { "user-agent": "Kairoseth-Content-Audit/1.0" } });
    const html = await response.text();
    const text = visibleText(html);
    const foundLinks = links(html);
    for (const found of foundLinks) if (!visited.has(found) && !queue.includes(found)) queue.push(found);
    pages.push({ path, url: url.href, status: response.status, title: title(html), text, characters: text.length, flags: editorialFlags(text), links: foundLinks });
    console.log(`${response.status} ${path} (${text.length} chars)`);
  } catch (error) {
    pages.push({ path, url: url.href, status: 0, title: "", text: "", characters: 0, flags: ["fetch-error"], error: error instanceof Error ? error.message : String(error), links: [] });
  }
}

await mkdir("audit-output", { recursive: true });
await writeFile("audit-output/live-pages.json", JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl: base.href, pageCount: pages.length, pages }, null, 2));

const markdown = [
  "# Live public content crawl",
  "",
  `Base: ${base.href}`,
  `Pages crawled: **${pages.length}**`,
  "",
  ...pages.map((page) => [
    `## ${page.path}`,
    "",
    `- status: ${page.status}`,
    `- title: ${page.title || "—"}`,
    `- visible characters: ${page.characters}`,
    `- flags: ${page.flags.length ? page.flags.join(", ") : "none"}`,
    "",
    page.text,
    ""
  ].join("\n"))
].join("\n");
await writeFile("audit-output/live-pages.md", markdown);
console.log(`Live content crawl complete: ${pages.length} pages.`);