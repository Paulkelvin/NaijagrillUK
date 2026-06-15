/**
 * Seeds the hardcoded blog content (categories + posts, including images) into
 * Sanity. Run with:  npm run seed:sanity
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_WRITE_TOKEN
 *
 * Local images (/images/...) are uploaded as Sanity assets; external image
 * URLs are fetched and uploaded too. Documents use deterministic _ids so the
 * script is safe to re-run (it updates rather than duplicates).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@sanity/client";
import { fallbackBlogCategories, fallbackBlogPosts } from "@/sanity/fallbacks";

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

const assetCache = new Map<string, string>();

async function uploadImage(src: string): Promise<string | null> {
  if (assetCache.has(src)) return assetCache.get(src)!;
  try {
    let buffer: Buffer;
    let filename: string;
    if (src.startsWith("http")) {
      const res = await fetch(src);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      buffer = Buffer.from(await res.arrayBuffer());
      filename = "blog-image.jpg";
    } else {
      const filePath = path.join(process.cwd(), "public", src.replace(/^\//, ""));
      buffer = readFileSync(filePath);
      filename = path.basename(filePath);
    }
    const asset = await client.assets.upload("image", buffer, { filename });
    assetCache.set(src, asset._id);
    console.log("  uploaded", src);
    return asset._id;
  } catch (error) {
    console.warn("  ! image upload failed:", src, (error as Error).message);
    return null;
  }
}

const imageField = (assetId: string) => ({
  _type: "image",
  asset: { _type: "reference", _ref: assetId },
});

const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function run() {
  console.log(`Seeding Sanity → project ${projectId}, dataset ${dataset}\n`);

  // Categories
  const categoryRef = new Map<string, string>();
  console.log("Categories:");
  for (const category of fallbackBlogCategories) {
    const _id = `category-${category.slug}`;
    await client.createOrReplace({
      _id,
      _type: "blogCategory",
      title: category.title,
      slug: { _type: "slug", current: category.slug },
      description: category.description,
    });
    categoryRef.set(category._id, _id);
    console.log("  •", category.title);
  }

  // Posts
  console.log("\nPosts:");
  for (const post of fallbackBlogPosts) {
    const _id = `post-${slugify(post.slug)}`;
    console.log("  •", post.title);

    const featuredAssetId =
      typeof post.featuredImage === "string"
        ? await uploadImage(post.featuredImage)
        : null;

    const doc: Record<string, unknown> = {
      _id,
      _type: "blogPost",
      title: post.title,
      slug: { _type: "slug", current: post.slug },
      author: post.author,
      excerpt: post.excerpt,
      publishedAt: post.publishedAt,
      body: post.body,
    };

    if (featuredAssetId) doc.featuredImage = imageField(featuredAssetId);

    const catRef = post.category ? categoryRef.get(post.category._id) : undefined;
    if (catRef) doc.category = { _type: "reference", _ref: catRef };

    if (post.faqs?.length) {
      doc.faqs = post.faqs.map((faq, index) => ({
        _type: "faqItem",
        _key: `faq-${index}`,
        question: faq.question,
        answer: faq.answer,
      }));
    }

    if (post.seo) {
      doc.seo = {
        _type: "seoMetadata",
        title: post.seo.title,
        description: post.seo.description,
      };
    }

    await client.createOrReplace(doc as { _id: string; _type: string });
  }

  console.log(
    `\nDone. Seeded ${fallbackBlogCategories.length} categories and ${fallbackBlogPosts.length} posts.`,
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
