import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const sourceRoots = ["app", "components", "domain", "repositories", "adapters", "lib", "data"];
const sourceExtensions = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const allowedEnvironmentTemplates = new Set([".env.example", ".env.demo.example"]);
const findings = [];

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

for (const root of sourceRoots) {
  let files = [];
  try {
    files = await walk(root);
  } catch {
    continue;
  }

  for (const file of files) {
    const content = await readFile(file, "utf8");

    if (/console\.(log|debug)\s*\(/.test(content)) {
      findings.push(`${file}: debug console logging`);
    }

    if (/NEXT_PUBLIC_[A-Z0-9_]*(SECRET|PASSWORD|PRIVATE_KEY|ACCESS_TOKEN|API_KEY)/.test(content)) {
      findings.push(`${file}: suspicious public environment variable name`);
    }

    if (/(-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,})/.test(content)) {
      findings.push(`${file}: possible embedded credential/private key`);
    }

    if (/fetch\(\s*["'`]https?:\/\//.test(content)) {
      findings.push(`${file}: hard-coded fetch URL; use configuration/adapters instead`);
    }

    if (/\beval\s*\(|new\s+Function\s*\(/.test(content)) {
      findings.push(`${file}: dynamic code execution is not allowed in the starter`);
    }

    if (/dangerouslySetInnerHTML/.test(content)) {
      findings.push(`${file}: dangerouslySetInnerHTML requires explicit security review`);
    }

    if (/document\.cookie/.test(content)) {
      findings.push(`${file}: browser-managed cookies are disallowed; keep session state server-side`);
    }
  }
}

const rootEntries = await readdir(".");
for (const name of rootEntries) {
  if (name.startsWith(".env") && !allowedEnvironmentTemplates.has(name)) {
    findings.push(`${name}: committed environment file`);
  }
}

if (findings.length) {
  console.error("Public safety check failed:\n");
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exit(1);
}

console.log("Public safety check passed.");
