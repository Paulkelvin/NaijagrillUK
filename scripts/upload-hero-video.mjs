/**
 * Uploads a hero background video to Sanity and attaches it to the homepage
 * document's `heroVideo` field (the source of truth for the homepage hero).
 *
 * Usage:  node scripts/upload-hero-video.mjs [path-to-video.mp4] [fieldName]
 * Defaults: naijagrill-hero.mp4 → heroVideo
 * Mobile:   node scripts/upload-hero-video.mjs naijagrill-hero-mobile.mp4 heroVideoMobile
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_WRITE_TOKEN
 */
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { createClient } from "@sanity/client";

// --- load .env.local -------------------------------------------------------
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !token) {
  console.error(
    "Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_WRITE_TOKEN in .env.local",
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: "2024-01-01",
  useCdn: false,
});

const filePath = process.argv[2] ?? "naijagrill-hero.mp4";
const field = process.argv[3] ?? "heroVideo";
const buffer = readFileSync(filePath);
console.log(
  `Uploading ${filePath} (${(buffer.length / 1048576).toFixed(1)} MB) to Sanity → ${field}…`,
);

const asset = await client.assets.upload("file", buffer, {
  filename: basename(filePath),
  contentType: "video/mp4",
});
console.log("  ✓ uploaded asset:", asset._id);

// Attach to every homepage doc that exists (published and any draft) so the
// video survives a later publish from Studio.
const ids = await client.fetch(`*[_type == "homepage"]._id`);
if (!ids.length) {
  console.error(
    "No homepage document found in Sanity. Run `npm run seed:sanity` first.",
  );
  process.exit(1);
}

const fileField = {
  _type: "file",
  asset: { _type: "reference", _ref: asset._id },
};

for (const id of ids) {
  await client.patch(id).set({ [field]: fileField }).commit();
  console.log(`  ✓ set ${field} on`, id);
}

const url = await client.fetch(
  `*[_type == "homepage"][0].${field}.asset->url`,
);
console.log(`\nDone. ${field} URL is now:\n  ` + url);
