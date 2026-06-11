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
          { title: "Rice Specials", value: "rice-specials" },
          { title: "Soups & Swallows", value: "soups-swallows" },
          { title: "Grill & Suya", value: "grill-suya" },
          { title: "Seafood & Pepper Soup", value: "seafood-pepper" },
          { title: "Small Chops", value: "small-chops" },
          { title: "Sides & Drinks", value: "sides-drinks" },
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
    defineField({
      name: "localImage",
      title: "Local Image Path",
      description:
        "Temporary public image path, for example /images/menu/naijagrill-jollof-rice.jpg, until the image is uploaded as a Sanity asset.",
      type: "string",
    }),
    defineField({
      name: "badge",
      title: "Badge",
      description: "Short label shown on featured menu cards.",
      type: "string",
    }),
    defineField({
      name: "orderable",
      title: "Available on Uber Eats",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "uberEatsUrl",
      title: "Uber Eats URL",
      type: "url",
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
