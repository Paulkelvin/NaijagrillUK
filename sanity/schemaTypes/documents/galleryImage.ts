import { defineField, defineType } from "sanity";

export const galleryImage = defineType({
  name: "galleryImage",
  title: "Gallery Image",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string" }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({ name: "alt", title: "Alt Text", type: "string" }),
    defineField({ name: "caption", title: "Caption", type: "string" }),
    defineField({ name: "order", title: "Sort Order", type: "number" }),
  ],
  orderings: [
    {
      title: "Sort Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "title", media: "image" },
  },
});
