import { copyFile, access } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const source = path.join(root, ".env.demo.example");
const target = path.join(root, ".env.local");
const force = process.argv.includes("--force");

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(source))) {
  throw new Error(".env.demo.example is missing. Run this command from the repository root.");
}

if ((await exists(target)) && !force) {
  console.error(".env.local already exists; refusing to overwrite it. Use `npm run setup:demo -- --force` only if you intentionally want to replace it.");
  process.exitCode = 1;
} else {
  await copyFile(source, target);
  console.log("Local demo profile written to .env.local.");
  console.log("Run `npm run dev` for development or `npm run build && npm start` for a production-build smoke test.");
}
