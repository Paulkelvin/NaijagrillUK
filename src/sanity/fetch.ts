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
  openingHoursQuery,
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
  return data ?? fallbackHomepage;
}

export async function getMenuItems(): Promise<MenuItemData[]> {
  const data = await fetchFromSanity<MenuItemData[]>(menuItemsQuery);
  return data?.length ? data : fallbackMenuItems;
}

export async function getTestimonials(): Promise<TestimonialData[]> {
  const data = await fetchFromSanity<TestimonialData[]>(testimonialsQuery);
  return data?.length ? data : fallbackTestimonials;
}

export async function getOpeningHours(): Promise<OpeningHoursData> {
  const data = await fetchFromSanity<OpeningHoursData>(openingHoursQuery);
  return data ?? fallbackOpeningHours;
}

export async function getContactInfo(): Promise<ContactInfoData> {
  const data = await fetchFromSanity<ContactInfoData>(contactInfoQuery);
  return data ?? fallbackContact;
}

export async function getBlogPosts(): Promise<BlogPostPreview[]> {
  const data = await fetchFromSanity<BlogPostPreview[]>(blogPostsQuery);
  return data?.length
    ? data
    : fallbackBlogPosts.map((post) => ({
        _id: post._id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        featuredImage: post.featuredImage,
        author: post.author,
        publishedAt: post.publishedAt,
        category: post.category,
      }));
}

export async function getBlogPost(slug: string): Promise<BlogPostData | null> {
  const data = await fetchFromSanity<BlogPostData>(blogPostBySlugQuery, {
    slug,
  });
  if (data) {
    if (!data.relatedPosts?.length) {
      const all = await getBlogPosts();
      data.relatedPosts = all
        .filter((p) => p.slug !== slug)
        .slice(0, 3);
    }
    return data;
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
  if (data?.length) return data;

  return fallbackBlogPosts
    .filter((post) => post.category?.slug === category)
    .map((post) => ({
      _id: post._id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      featuredImage: post.featuredImage,
      author: post.author,
      publishedAt: post.publishedAt,
      category: post.category,
    }));
}

export async function getBlogCategories(): Promise<BlogCategoryData[]> {
  const data = await fetchFromSanity<BlogCategoryData[]>(blogCategoriesQuery);
  return data?.length ? data : fallbackBlogCategories;
}

export async function getEvents(): Promise<EventData[]> {
  const data = await fetchFromSanity<EventData[]>(eventsQuery);
  return data?.length ? data : fallbackEvents;
}

export async function getGalleryImages(): Promise<GalleryImageData[]> {
  const data = await fetchFromSanity<GalleryImageData[]>(galleryImagesQuery);
  return data?.length ? data : fallbackGalleryImages;
}

export async function getExplorePage(): Promise<ExplorePageData> {
  const data = await fetchFromSanity<ExplorePageData>(explorePageQuery);
  return data ?? fallbackExplorePage;
}

export async function getAllSlugs(): Promise<{
  blog: { slug: string }[];
  events: { slug: string }[];
}> {
  const data = await fetchFromSanity<{
    blog: { slug: string }[];
    events: { slug: string }[];
  }>(allSlugsQuery);

  if (data) return data;

  return {
    blog: fallbackBlogPosts.map((p) => ({ slug: p.slug })),
    events: [],
  };
}
