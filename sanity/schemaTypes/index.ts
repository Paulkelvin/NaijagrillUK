import { blogCategory } from "./documents/blogCategory";
import { blogPost } from "./documents/blogPost";
import { contactInfo } from "./documents/contactInfo";
import { event } from "./documents/event";
import { explorePage } from "./documents/explorePage";
import { galleryImage } from "./documents/galleryImage";
import { homepage } from "./documents/homepage";
import { menuItem } from "./documents/menuItem";
import { openingHours } from "./documents/openingHours";
import { testimonial } from "./documents/testimonial";
import { faqItem } from "./objects/faqItem";
import { seoMetadata } from "./objects/seoMetadata";

export const schemaTypes = [
  seoMetadata,
  faqItem,
  homepage,
  menuItem,
  testimonial,
  event,
  blogCategory,
  blogPost,
  galleryImage,
  openingHours,
  contactInfo,
  explorePage,
];
