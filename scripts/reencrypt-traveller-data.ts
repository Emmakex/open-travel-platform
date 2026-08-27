import { reencryptTravellerDataBatch } from "../lib/traveller-data";
import { getMongoClient } from "../lib/mongodb";

function numericOption(name: string, fallback: number, min: number, max: number) {
  const prefix = `--${name}=`;
  const argument = process.argv.slice(2).find((value) => value.startsWith(prefix));
  if (!argument) return fallback;
  const parsed = Number.parseInt(argument.slice(prefix.length), 10);
  if (!Number.isFinite(parsed)) throw new Error(`${name} must be an integer.`);
  return Math.max(min, Math.min(max, parsed));
}

async function main() {
  const batchSize = numericOption("batch-size", 25, 1, 100);
  const maxBatches = numericOption("max-batches", 20, 1, 1000);
  const client = await getMongoClient();

  try {
    for (let batch = 1; batch <= maxBatches; batch += 1) {
      const result = await reencryptTravellerDataBatch({ limit: batchSize });
      console.info(JSON.stringify({
        event: "traveller-data-reencryption-batch",
        batch,
        keyId: result.currentKeyId,
        scanned: result.scanned,
        migrated: result.migrated,
        remaining: result.remaining
      }));

      if (result.remaining === 0) {
        console.info(JSON.stringify({
          event: "traveller-data-reencryption-complete",
          keyId: result.currentKeyId,
          batches: batch
        }));
        return;
      }
    }

    throw new Error(
      `Traveller-data re-encryption reached --max-batches=${maxBatches} with records still remaining. Re-run the command until remaining reaches zero before removing previous keys.`
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Traveller-data re-encryption failed.");
  process.exitCode = 1;
});
