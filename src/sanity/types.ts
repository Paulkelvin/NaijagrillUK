import type { PortableTextBlock } from "@portabletext/types";

export type SeoMetadata = {
  title?: string;
  description?: string;
  ogImage?: SanityImage;
  noIndex?: boolean;
};

export type SanityImage = {
  asset?: { _ref: string; _type: string };
  alt?: string;
};

export type HomepageData = {
  heroEyebrow: string;
  heroHeadline: string;
  heroSubtext: string;
  heroImage?: SanityImage | string;
  heroVideoUrl?: string;
  storyEyebrow: string;
  storyHeadline: string;
  storyParagraphs: string[];
  storyImage?: SanityImage | string;
  storyVideoUrl?: string;
  cuisineEyebrow: string;
  cuisineHeadline: string;
  cuisineFeatures: {
    title: string;
    subtitle: string;
    description: string;
    image?: SanityImage | string;
    align: "left" | "right";
  }[];
  experienceEyebrow: string;
  experienceHeadline: string;
  experienceBody: string;
  experienceImage?: SanityImage | string;
  visitHeadline: string;
  visitImage?: SanityImage | string;
  seo?: SeoMetadata;
};

export type MenuItemData = {
  _id: string;
  title: string;
  description: string;
  price: number;
  section: string;
  image?: SanityImage | string;
  localImage?: string;
  badge?: string;
  orderable?: boolean;
  uberEatsUrl?: string;
  order?: number;
  seo?: SeoMetadata;
};

export type TestimonialData = {
  _id: string;
  quote: string;
  author: string;
  context: string;
};

export type OpeningHoursData = {
  summary: string;
  lunchHours: string;
  dinnerHours: string;
  schedule: {
    day: string;
    open?: string;
    close?: string;
    closed?: boolean;
    service?: string;
  }[];
};

export type ContactInfoData = {
  email: string;
  phone: string;
  landline?: string;
  street: string;
  area: string;
  city: string;
  postcode: string;
  country: string;
  locationNote?: string;
  instagram?: string;
};

export type BlogCategoryData = {
  _id: string;
  title: string;
  slug: string;
  description?: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type BlogPostData = {
  _id: string;
  title: string;
  slug: string;
  featuredImage?: SanityImage | string;
  author: string;
  category?: BlogCategoryData;
  excerpt: string;
  body: PortableTextBlock[];
  faqs?: FaqItem[];
  relatedPosts?: BlogPostPreview[];
  publishedAt: string;
  seo?: SeoMetadata;
};

export type BlogPostPreview = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: SanityImage | string;
  author: string;
  publishedAt: string;
  category?: BlogCategoryData;
};

export type EventData = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: SanityImage | string;
  eventDate: string;
  location: string;
  body?: PortableTextBlock[];
  seo?: SeoMetadata;
};

export type GalleryImageData = {
  _id: string;
  title: string;
  image?: SanityImage | string;
  alt?: string;
  caption?: string;
  order?: number;
};

export type ExplorePageData = {
  title: string;
  subtitle: string;
  heroImage?: SanityImage | string;
  introduction: PortableTextBlock[];
  sections: {
    heading: string;
    body: PortableTextBlock[];
    image?: SanityImage | string;
    imagePosition?: "left" | "right" | "full";
  }[];
  faqs?: FaqItem[];
  seo?: SeoMetadata;
};
