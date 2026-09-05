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

  const routeImages: Record<string, readonly string[]> = {
    "": BUSINESS.images,
    "/menu": BUSINESS.images.filter((path) => path.startsWith("/images/menu/")),
  };

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
    ...(routeImages[route]?.length
      ? { images: routeImages[route].map((path) => `${baseUrl}${path}`) }
      : {}),
  }));

  const blogEntries: MetadataRoute.Sitemap = blog.map(({ slug }) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map(
    (category) => ({
      url: `${baseUrl}/blog/category/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }),
  );

  return [...staticEntries, ...blogEntries, ...categoryEntries];
}
