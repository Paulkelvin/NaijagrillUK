import { defineField, defineType } from "sanity";

export const event = defineType({
  name: "event",
  title: "Event",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string" }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
    }),
    defineField({ name: "excerpt", title: "Excerpt", type: "text", rows: 3 }),
    defineField({
      name: "featuredImage",
      title: "Featured Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({ name: "eventDate", title: "Event Date", type: "datetime" }),
    defineField({ name: "location", title: "Location", type: "string" }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({ name: "seo", title: "SEO", type: "seoMetadata" }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "eventDate",
      media: "featuredImage",
    },
  },
});
