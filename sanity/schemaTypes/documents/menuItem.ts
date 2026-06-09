import { defineField, defineType } from "sanity";

export const menuItem = defineType({
  name: "menuItem",
  title: "Menu Item",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string" }),
    defineField({ name: "description", title: "Description", type: "text" }),
    defineField({ name: "price", title: "Price (£)", type: "number" }),
    defineField({
      name: "section",
      title: "Menu Section",
      type: "string",
      options: {
        list: [
          { title: "From the Fire", value: "from-the-fire" },
          { title: "At the Centre", value: "at-the-centre" },
          { title: "Sides", value: "sides" },
          { title: "Desserts", value: "desserts" },
          { title: "Drinks", value: "drinks" },
        ],
      },
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({ name: "order", title: "Sort Order", type: "number" }),
    defineField({ name: "seo", title: "SEO", type: "seoMetadata" }),
  ],
  orderings: [
    {
      title: "Sort Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "section", media: "image" },
  },
});
