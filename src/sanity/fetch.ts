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
  fallbackTestimonials,
  getFallbackRelatedPosts,
} from "./fallbacks";
import {
  mergeBlogPost,
  mergeBlogPreview,
  mergeEvent,
  mergeExplorePage,
  mergeGalleryImage,
  mergeHomepage,
  mergeMenuItems,
} from "./merge";
import { sanityClient } from "./client";
import {
  allSlugsQuery,
  blogCategoriesQuery,
  blogPostBySlugQuery,
  blogPostsByCategoryQuery,
  blogPostsQuery,
  contactInfoQuery,
  eventsQuery,
  explorePageQuery,
  galleryImagesQuery,
  homepageQuery,
  menuItemsQuery,
  testimonialsQuery,
} from "./queries";
import type {
  BlogCategoryData,
  BlogPostData,
  BlogPostPreview,
  ContactInfoData,
  EventData,
  ExplorePageData,
  GalleryImageData,
  HomepageData,
  MenuItemData,
  OpeningHoursData,
  TestimonialData,
} from "./types";

async function fetchFromSanity<T>(
  query: string,
  params?: Record<string, unknown>,
): Promise<T | null> {
  if (!sanityClient) return null;
  try {
    return await sanityClient.fetch<T>(query, params ?? {});
  } catch {
    return null;
  }
}

export async function getHomepage(): Promise<HomepageData> {
  const data = await fetchFromSanity<HomepageData>(homepageQuery);
  if (!data) return fallbackHomepage;
  return mergeHomepage(data, fallbackHomepage);
}

export async function getMenuItems(): Promise<MenuItemData[]> {
  const data = await fetchFromSanity<MenuItemData[]>(menuItemsQuery);
  return data?.length ? mergeMenuItems(data, fallbackMenuItems) : fallbackMenuItems;
}

export async function getTestimonials(): Promise<TestimonialData[]> {
  const data = await fetchFromSanity<TestimonialData[]>(testimonialsQuery);
  return data?.length ? data : fallbackTestimonials;
}

export async function getOpeningHours(): Promise<OpeningHoursData> {
  // Opening hours are maintained in code (fallbackOpeningHours). The CMS
  // openingHours document holds stale seed values, so the code source wins.
  // To manage hours in Studio again, fetch and return CMS data here.
  return fallbackOpeningHours;
}

export async function getContactInfo(): Promise<ContactInfoData> {
  const data = await fetchFromSanity<ContactInfoData>(contactInfoQuery);
  return data ?? fallbackContact;
}

function toPreview(post: BlogPostData): BlogPostPreview {
  return {
    _id: post._id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    featuredImage: post.featuredImage,
    author: post.author,
    publishedAt: post.publishedAt,
    category: post.category,
  };
}

function byNewest(a: BlogPostPreview, b: BlogPostPreview) {
  return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
}

export async function getBlogPosts(): Promise<BlogPostPreview[]> {
  const data = await fetchFromSanity<BlogPostPreview[]>(blogPostsQuery);
  const cmsPosts = (data ?? []).map((post) => {
    const fallback = fallbackBlogPosts.find((p) => p.slug === post.slug);
    return mergeBlogPreview(post, fallback);
  });
  const cmsSlugs = new Set(cmsPosts.map((p) => p.slug));
  const extraPosts = fallbackBlogPosts
    .filter((post) => !cmsSlugs.has(post.slug))
    .map(toPreview);
  return [...cmsPosts, ...extraPosts].sort(byNewest);
}

export async function getBlogPost(slug: string): Promise<BlogPostData | null> {
  const data = await fetchFromSanity<BlogPostData>(blogPostBySlugQuery, {
    slug,
  });
  if (data) {
    const fallback = fallbackBlogPosts.find((post) => post.slug === slug);
    const merged = mergeBlogPost(data, fallback);
    if (!merged.relatedPosts?.length) {
      const all = await getBlogPosts();
      merged.relatedPosts = all
        .filter((p) => p.slug !== slug)
        .slice(0, 3);
    }
    return merged;
  }

  const fallback = fallbackBlogPosts.find((post) => post.slug === slug);
  if (!fallback) return null;

  return {
    ...fallback,
    relatedPosts: getFallbackRelatedPosts(slug).slice(0, 3),
  };
}

export async function getBlogPostsByCategory(
  category: string,
): Promise<BlogPostPreview[]> {
  const data = await fetchFromSanity<BlogPostPreview[]>(
    blogPostsByCategoryQuery,
    { category },
  );
  const cmsPosts = (data ?? []).map((post) => {
    const fallback = fallbackBlogPosts.find((p) => p.slug === post.slug);
    return mergeBlogPreview(post, fallback);
  });
  const cmsSlugs = new Set(cmsPosts.map((p) => p.slug));
  const extraPosts = fallbackBlogPosts
    .filter((post) => post.category?.slug === category && !cmsSlugs.has(post.slug))
    .map(toPreview);
  return [...cmsPosts, ...extraPosts].sort(byNewest);
}

export async function getBlogCategories(): Promise<BlogCategoryData[]> {
  const data = await fetchFromSanity<BlogCategoryData[]>(blogCategoriesQuery);
  return data?.length ? data : fallbackBlogCategories;
}

export async function getEvents(): Promise<EventData[]> {
  const data = await fetchFromSanity<EventData[]>(eventsQuery);
  if (!data?.length) return fallbackEvents;

  return data.map((event, index) => {
    const fallback =
      fallbackEvents.find((e) => e.slug === event.slug) ??
      fallbackEvents[index];
    return fallback ? mergeEvent(event, fallback) : event;
  });
}

export async function getGalleryImages(): Promise<GalleryImageData[]> {
  const data = await fetchFromSanity<GalleryImageData[]>(galleryImagesQuery);
  if (!data?.length) return fallbackGalleryImages;

  return data.map((item, index) => {
    const fallback = fallbackGalleryImages[index] ?? fallbackGalleryImages[0];
    return mergeGalleryImage(item, fallback);
  });
}

export async function getExplorePage(): Promise<ExplorePageData> {
  const data = await fetchFromSanity<ExplorePageData>(explorePageQuery);
  if (!data) return fallbackExplorePage;
  return mergeExplorePage(data, fallbackExplorePage);
}

export async function getAllSlugs(): Promise<{
  blog: { slug: string }[];
  events: { slug: string }[];
}> {
  const data = await fetchFromSanity<{
    blog: { slug: string }[];
    events: { slug: string }[];
  }>(allSlugsQuery);

  const sanityBlog = data?.blog ?? [];
  const blogSlugs = new Set(sanityBlog.map((b) => b.slug));
  const blog = [
    ...sanityBlog,
    ...fallbackBlogPosts
      .filter((p) => !blogSlugs.has(p.slug))
      .map((p) => ({ slug: p.slug })),
  ];

  return { blog, events: data?.events ?? [] };
}
