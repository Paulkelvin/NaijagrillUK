import type { MetadataRoute } from "next";
import { BUSINESS } from "@/lib/business";
import {
  getAllSlugs,
  getBlogCategories,
} from "@/sanity/fetch";

const staticRoutes = [
  "",
  "/menu",
  "/story",
  "/blog",
  "/nigerian-restaurant-birmingham",
  "/events-catering",
  "/reservations",
  "/contact",
  "/privacy",
  "/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = BUSINESS.website;
  const [{ blog }, categories] = await Promise.all([
    getAllSlugs(),
    getBlogCategories(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority:
      route === ""
        ? 1
        : route === "/nigerian-restaurant-birmingham"
          ? 0.9
          : 0.8,
  }));

  const blogEntries: MetadataRoute.Sitemap = blog.map(({ slug }) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // Sanity has no unique constraint on blogCategory.slug, so a duplicate
  // document (same slug, different _id — a real one found live: two full
  // sets of "Culture"/"Events"/"Local Guides"/"Nigerian Food" categories)
  // would otherwise produce two sitemap <url> entries for the same page.
  // Deduped defensively here rather than trusting the data stays clean.
  const uniqueCategorySlugs = [...new Set(categories.map((category) => category.slug))];
  const categoryEntries: MetadataRoute.Sitemap = uniqueCategorySlugs.map(
    (slug) => ({
      url: `${baseUrl}/blog/category/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }),
  );

  return [...staticEntries, ...blogEntries, ...categoryEntries];
}
