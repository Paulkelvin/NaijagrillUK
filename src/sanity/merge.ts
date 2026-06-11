import type {
  BlogPostData,
  BlogPostPreview,
  EventData,
  ExplorePageData,
  GalleryImageData,
  HomepageData,
  MenuItemData,
} from "./types";

function hasImage(
  image: HomepageData["heroImage"] | undefined,
): boolean {
  if (!image) return false;
  if (typeof image === "string") return image.length > 0;
  return Boolean(image.asset?._ref);
}

export function mergeHomepage(
  cms: HomepageData,
  fallback: HomepageData,
): HomepageData {
  const fallbackFeatures = fallback.cuisineFeatures ?? [];

  return {
    ...fallback,
    ...cms,
    heroImage: hasImage(cms.heroImage) ? cms.heroImage : fallback.heroImage,
    storyImage: hasImage(cms.storyImage) ? cms.storyImage : fallback.storyImage,
    experienceImage: hasImage(cms.experienceImage)
      ? cms.experienceImage
      : fallback.experienceImage,
    visitImage: hasImage(cms.visitImage) ? cms.visitImage : fallback.visitImage,
    storyParagraphs: cms.storyParagraphs?.length
      ? cms.storyParagraphs
      : fallback.storyParagraphs,
    cuisineFeatures:
      cms.cuisineFeatures?.map((feature, index) => {
        const fb = fallbackFeatures[index];
        return {
          ...fb,
          ...feature,
          image: hasImage(feature.image) ? feature.image : fb?.image,
        };
      }) ?? fallback.cuisineFeatures,
    seo: { ...fallback.seo, ...cms.seo },
  };
}

export function mergeExplorePage(
  cms: ExplorePageData,
  fallback: ExplorePageData,
): ExplorePageData {
  return {
    ...fallback,
    ...cms,
    heroImage: hasImage(cms.heroImage) ? cms.heroImage : fallback.heroImage,
    introduction: cms.introduction?.length
      ? cms.introduction
      : fallback.introduction,
    sections:
      cms.sections?.map((section, index) => {
        const fb = fallback.sections[index];
        return {
          ...fb,
          ...section,
          image: hasImage(section.image) ? section.image : fb?.image,
        };
      }) ?? fallback.sections,
    faqs: cms.faqs?.length ? cms.faqs : fallback.faqs,
    seo: { ...fallback.seo, ...cms.seo },
  };
}

export function mergeEvent(cms: EventData, fallback: EventData): EventData {
  return {
    ...fallback,
    ...cms,
    featuredImage: hasImage(cms.featuredImage)
      ? cms.featuredImage
      : fallback.featuredImage,
  };
}

export function mergeBlogPreview(
  cms: BlogPostPreview,
  fallback?: BlogPostPreview,
): BlogPostPreview {
  if (!fallback) {
    return {
      ...cms,
      featuredImage: hasImage(cms.featuredImage)
        ? cms.featuredImage
        : cms.featuredImage,
    };
  }
  return {
    ...fallback,
    ...cms,
    featuredImage: hasImage(cms.featuredImage)
      ? cms.featuredImage
      : fallback.featuredImage,
  };
}

export function mergeBlogPost(
  cms: BlogPostData,
  fallback?: BlogPostData,
): BlogPostData {
  if (!fallback) return cms;
  return {
    ...fallback,
    ...cms,
    featuredImage: hasImage(cms.featuredImage)
      ? cms.featuredImage
      : fallback.featuredImage,
    body: cms.body?.length ? cms.body : fallback.body,
    faqs: cms.faqs?.length ? cms.faqs : fallback.faqs,
    seo: { ...fallback.seo, ...cms.seo },
  };
}

export function mergeGalleryImage(
  cms: GalleryImageData,
  fallback: GalleryImageData,
): GalleryImageData {
  return {
    ...fallback,
    ...cms,
    image: hasImage(cms.image) ? cms.image : fallback.image,
  };
}

function normaliseTitle(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function mergeMenuItems(
  cmsItems: MenuItemData[],
  fallbackItems: MenuItemData[],
): MenuItemData[] {
  const fallbackByTitle = new Map(
    fallbackItems.map((item) => [normaliseTitle(item.title), item]),
  );
  const cmsTitles = new Set(cmsItems.map((item) => normaliseTitle(item.title)));

  return [
    ...cmsItems.map((item) => {
      const fallback = fallbackByTitle.get(normaliseTitle(item.title));
      if (!fallback) return item;

      return {
        ...fallback,
        ...item,
        image: hasImage(item.image) ? item.image : fallback.image,
        localImage: item.localImage ?? fallback.localImage,
        badge: item.badge ?? fallback.badge,
        orderable: item.orderable ?? fallback.orderable,
        uberEatsUrl: item.uberEatsUrl ?? fallback.uberEatsUrl,
        seo: { ...fallback.seo, ...item.seo },
      };
    }),
    ...fallbackItems.filter((item) => !cmsTitles.has(normaliseTitle(item.title))),
  ].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}
