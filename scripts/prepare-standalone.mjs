import { access, cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const bundle = path.join(root, ".next", "standalone");
const server = path.join(bundle, "server.js");
const staticSource = path.join(root, ".next", "static");
const staticTarget = path.join(bundle, ".next", "static");
const publicSource = path.join(root, "public");
const publicTarget = path.join(bundle, "public");

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(server))) {
  throw new Error(".next/standalone/server.js is missing. Run `npm run build` first; next.config.ts must keep output: standalone.");
}

if (!(await exists(staticSource))) {
  throw new Error(".next/static is missing. Run `npm run build` before packaging the standalone runtime.");
}

await rm(staticTarget, { recursive: true, force: true });
await mkdir(path.dirname(staticTarget), { recursive: true });
await cp(staticSource, staticTarget, { recursive: true });

await rm(publicTarget, { recursive: true, force: true });
if (await exists(publicSource)) {
  await cp(publicSource, publicTarget, { recursive: true });
}

console.log("Standalone runtime prepared in .next/standalone.");
console.log("Run it with runtime environment variables, for example: HOSTNAME=0.0.0.0 PORT=3000 node .next/standalone/server.js");
