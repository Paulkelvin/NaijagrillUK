/**
 * Seeds the hardcoded site content (homepage, gallery, events, explore page,
 * menu, and blog — including images) into Sanity. Run with:  npm run seed:sanity
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
import {
  fallbackBlogCategories,
  fallbackBlogPosts,
  fallbackContact,
  fallbackEvents,
  fallbackExplorePage,
  fallbackGalleryImages,
  fallbackHomepage,
  fallbackMenuItems,
  fallbackOpeningHours,
} from "@/sanity/fallbacks";

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
      filename = "image.jpg";
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

/** Upload an image source (local path or URL) and return a Sanity image field. */
async function toImageField(src: unknown, alt?: string) {
  if (typeof src !== "string" || !src) return undefined;
  const assetId = await uploadImage(src);
  if (!assetId) return undefined;
  return { ...imageField(assetId), ...(alt ? { alt } : {}) };
}

const seoField = (seo?: { title?: string; description?: string }) =>
  seo ? { _type: "seoMetadata", title: seo.title, description: seo.description } : undefined;

const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function seedHomepage() {
  console.log("\nHomepage:");
  const hp = fallbackHomepage;

  const features = [];
  for (let i = 0; i < hp.cuisineFeatures.length; i++) {
    const f = hp.cuisineFeatures[i];
    const image = await toImageField(f.image, f.title);
    features.push({
      _key: `feature-${i}`,
      title: f.title,
      subtitle: f.subtitle,
      description: f.description,
      align: f.align,
      ...(image ? { image } : {}),
    });
  }

  const heroImage = await toImageField(
    hp.heroImage,
    "Nigerian cuisine at NaijaGrill, Handsworth",
  );
  const storyImage = await toImageField(
    hp.storyImage,
    "The NaijaGrill story and kitchen",
  );
  const experienceImage = await toImageField(
    hp.experienceImage,
    "Intimate dining atmosphere at NaijaGrill",
  );
  const visitImage = await toImageField(
    hp.visitImage,
    "A table set for guests at NaijaGrill",
  );

  // Preserve videos already managed in Studio (e.g. uploaded video files) so a
  // re-seed never wipes them; only seed the YouTube fallbacks on first creation.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existing: any = await client.getDocument("homepage").catch(() => null);
  const videos = existing?.videos?.length
    ? existing.videos
    : (hp.videos ?? []).map((video, index) => ({
        _type: "object",
        _key: `video-${index}`,
        ...(video.url ? { url: video.url } : {}),
        ...(video.orientation ? { orientation: video.orientation } : {}),
        ...(video.title ? { title: video.title } : {}),
      }));

  await client.createOrReplace({
    _id: "homepage",
    _type: "homepage",
    heroEyebrow: hp.heroEyebrow,
    heroHeadline: hp.heroHeadline,
    heroSubtext: hp.heroSubtext,
    ...(heroImage ? { heroImage } : {}),
    storyEyebrow: hp.storyEyebrow,
    storyHeadline: hp.storyHeadline,
    storyParagraphs: hp.storyParagraphs,
    ...(storyImage ? { storyImage } : {}),
    ...(existing?.storyVideo ? { storyVideo: existing.storyVideo } : {}),
    cuisineEyebrow: hp.cuisineEyebrow,
    cuisineHeadline: hp.cuisineHeadline,
    cuisineFeatures: features,
    experienceEyebrow: hp.experienceEyebrow,
    experienceHeadline: hp.experienceHeadline,
    experienceBody: hp.experienceBody,
    ...(experienceImage ? { experienceImage } : {}),
    videoEyebrow: hp.videoEyebrow,
    videoHeadline: hp.videoHeadline,
    videoBody: hp.videoBody,
    videos,
    visitHeadline: hp.visitHeadline,
    ...(visitImage ? { visitImage } : {}),
    seo: seoField(hp.seo),
  });
  console.log("  • Homepage seeded");
}

async function seedOpeningHours() {
  console.log("\nOpening hours:");
  const oh = fallbackOpeningHours;
  await client.createOrReplace({
    _id: "openingHours",
    _type: "openingHours",
    summary: oh.summary,
    lunchHours: oh.lunchHours,
    dinnerHours: oh.dinnerHours,
    schedule: oh.schedule.map((day, index) => ({
      _type: "object",
      _key: `day-${index}`,
      day: day.day,
      open: day.open,
      close: day.close,
      closed: day.closed ?? false,
      ...(day.service ? { service: day.service } : {}),
    })),
  });
  console.log("  • Opening hours seeded (2pm — 11pm, every day)");
}

async function seedContactInfo() {
  console.log("\nContact info:");
  const c = fallbackContact;
  await client.createOrReplace({
    _id: "contactInfo",
    _type: "contactInfo",
    email: c.email,
    phone: c.phone,
    ...(c.landline ? { landline: c.landline } : {}),
    street: c.street,
    area: c.area,
    city: c.city,
    postcode: c.postcode,
    country: c.country,
    ...(c.locationNote ? { locationNote: c.locationNote } : {}),
    ...(c.instagram ? { instagram: c.instagram } : {}),
  });
  console.log("  • Contact info seeded (mobile + landline)");
}

async function seedGallery() {
  console.log("\nGallery images:");
  for (const item of fallbackGalleryImages) {
    const image = await toImageField(item.image, item.alt);
    await client.createOrReplace({
      _id: item._id,
      _type: "galleryImage",
      title: item.title,
      ...(image ? { image } : {}),
      alt: item.alt,
      caption: item.caption,
      order: item.order,
    });
    console.log("  •", item.title);
  }
}

async function seedEvents() {
  console.log("\nEvents:");
  for (const event of fallbackEvents) {
    const image = await toImageField(event.featuredImage, event.title);
    await client.createOrReplace({
      _id: event._id,
      _type: "event",
      title: event.title,
      slug: { _type: "slug", current: event.slug },
      excerpt: event.excerpt,
      ...(image ? { featuredImage: image } : {}),
      eventDate: event.eventDate,
      location: event.location,
    });
    console.log("  •", event.title);
  }
}

async function seedExplorePage() {
  console.log("\nExplore page:");
  const ex = fallbackExplorePage;

  const sections = [];
  for (let i = 0; i < ex.sections.length; i++) {
    const s = ex.sections[i];
    const image = await toImageField(s.image, s.heading);
    sections.push({
      _key: `section-${i}`,
      heading: s.heading,
      body: s.body,
      imagePosition: s.imagePosition,
      ...(image ? { image } : {}),
    });
  }

  const heroImage = await toImageField(ex.heroImage, ex.title);

  await client.createOrReplace({
    _id: "explorePage",
    _type: "explorePage",
    title: ex.title,
    subtitle: ex.subtitle,
    ...(heroImage ? { heroImage } : {}),
    introduction: ex.introduction,
    sections,
    faqs: ex.faqs?.map((faq, index) => ({
      _type: "faqItem",
      _key: `faq-${index}`,
      question: faq.question,
      answer: faq.answer,
    })),
    seo: seoField(ex.seo),
  });
  console.log("  • Explore page seeded");
}

async function seedMenuItems() {
  console.log("\nMenu items:");
  for (const item of fallbackMenuItems) {
    const image = await toImageField(item.image, item.title);
    await client.createOrReplace({
      _id: item._id,
      _type: "menuItem",
      title: item.title,
      description: item.description,
      price: item.price,
      section: item.section,
      ...(image ? { image } : {}),
      ...(item.localImage ? { localImage: item.localImage } : {}),
      ...(item.badge ? { badge: item.badge } : {}),
      orderable: item.orderable ?? true,
      ...(item.uberEatsUrl ? { uberEatsUrl: item.uberEatsUrl } : {}),
      order: item.order,
      seo: seoField(item.seo),
    });
    console.log("  •", item.title);
  }
}

async function seedBlog() {
  // Categories
  const categoryRef = new Map<string, string>();
  console.log("\nBlog categories:");
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
  console.log("\nBlog posts:");
  for (const post of fallbackBlogPosts) {
    const _id = `post-${slugify(post.slug)}`;
    console.log("  •", post.title);

    const featuredImage = await toImageField(post.featuredImage, post.title);

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

    if (featuredImage) doc.featuredImage = featuredImage;

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

    if (post.seo) doc.seo = seoField(post.seo);

    await client.createOrReplace(doc as { _id: string; _type: string });
  }
}

async function run() {
  console.log(`Seeding Sanity → project ${projectId}, dataset ${dataset}`);

  await seedHomepage();
  await seedOpeningHours();
  await seedContactInfo();
  await seedGallery();
  await seedEvents();
  await seedExplorePage();
  await seedMenuItems();
  await seedBlog();

  console.log(
    `\nDone. Seeded homepage, ${fallbackGalleryImages.length} gallery images, ` +
      `${fallbackEvents.length} events, explore page, ${fallbackMenuItems.length} menu items, ` +
      `${fallbackBlogCategories.length} blog categories and ${fallbackBlogPosts.length} posts.`,
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
