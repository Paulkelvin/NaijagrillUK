/**
 * Opt-in sync: pushes ONLY the named documents from sanity/seed.ndjson to
 * Sanity. Every other document is left untouched, and nothing is deleted.
 *
 * Usage:  npm run sanity:sync -- <document-id> [<document-id> ...]
 * Example: npm run sanity:sync -- blogPost-kelvin-ikeduba-review
 * Dry run: npm run sanity:sync -- --dry-run <document-id>
 *
 * Note: only fields present in the seed file are updated (patched). Fields that
 * exist only in Sanity (e.g. images added in Studio) are kept.
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_WRITE_TOKEN
 */
import { readFileSync } from "node:fs";
import { createClient } from "@sanity/client";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const ids = args.filter((a) => !a.startsWith("--"));

if (ids.length === 0) {
  console.error("Usage: npm run sanity:sync -- [--dry-run] <document-id> [...]");
  process.exit(1);
}

const docs = new Map(
  readFileSync("sanity/seed.ndjson", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l))
    .map((d) => [d._id, d]),
);

const missing = ids.filter((id) => !docs.has(id));
if (missing.length) {
  console.error(`Not found in sanity/seed.ndjson: ${missing.join(", ")}`);
  process.exit(1);
}

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!dryRun && (!projectId || !token)) {
  console.error(
    "Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_WRITE_TOKEN in .env.local",
  );
  process.exit(1);
}

const client = dryRun
  ? null
  : createClient({ projectId, dataset, token, apiVersion: "2024-01-01", useCdn: false });

for (const id of ids) {
  if (dryRun) {
    console.log(`[dry run] would update fields of ${id} in ${dataset}`);
    continue;
  }
  // Non-destructive: create the document if missing, then set only the fields
  // present in the seed file. Fields that exist only in Sanity are kept.
  const { _id, _type, ...fields } = docs.get(id);
  await client.createIfNotExists({ _id, _type });
  await client.patch(_id).set(fields).commit();
  console.log(`✓ synced ${id} (fields updated: ${Object.keys(fields).join(", ")})`);
}
