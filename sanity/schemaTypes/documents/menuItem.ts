import { defineField, defineType } from "sanity";

export const menuItem = defineType({
  name: "menuItem",
  title: "Menu Item",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "media", title: "Image" },
    { name: "ordering", title: "Ordering & Delivery" },
    { name: "seo", title: "SEO (advanced)" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "The dish name as guests see it, e.g. “Jollof Rice”.",
      group: "content",
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
      description:
        "One or two appetising sentences. This is the main text Google reads for the dish — mention key ingredients (e.g. smoky tomato rice, plantain, suya spice).",
      group: "content",
      validation: (rule) =>
        rule
          .required()
          .min(20)
          .max(300)
          .warning("Aim for a full, appetising sentence (20–300 characters)."),
    }),
    defineField({
      name: "price",
      title: "Price (£)",
      type: "number",
      description: "Price in pounds, numbers only (e.g. 14.99). No £ sign.",
      group: "content",
      validation: (rule) => rule.required().positive(),
    }),
    defineField({
      name: "section",
      title: "Menu Section",
      type: "string",
      description: "Which part of the menu this dish appears under.",
      group: "content",
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
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "badge",
      title: "Badge",
      type: "string",
      description:
        "Optional short label on featured cards, e.g. “Featured” or “Delivery favourite”. Leave blank for none.",
      group: "content",
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      description:
        "A clear, well-lit photo of the dish. Uploaded here it is served fast and optimised automatically.",
      group: "media",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
          description:
            "Describe the photo for screen readers and search engines, e.g. “Jollof rice with plantain and grilled chicken”. Important for SEO and accessibility.",
          validation: (rule) =>
            rule
              .max(120)
              .warning("Add a short description of the photo for SEO."),
        }),
      ],
    }),
    defineField({
      name: "localImage",
      title: "Local Image Path",
      description:
        "Fallback only: a path to an image already in the site code, e.g. /images/menu/naijagrill-jollof-rice.jpg. Prefer uploading an Image above instead.",
      type: "string",
      group: "media",
    }),
    defineField({
      name: "orderable",
      title: "Available on Uber Eats",
      type: "boolean",
      description: "Turn on if guests can order this dish for delivery.",
      group: "ordering",
      initialValue: true,
    }),
    defineField({
      name: "uberEatsUrl",
      title: "Uber Eats URL",
      type: "url",
      description:
        "Link to this dish (or the store) on Uber Eats. Leave blank to use the restaurant’s default Uber Eats link.",
      group: "ordering",
    }),
    defineField({
      name: "order",
      title: "Sort Order",
      type: "number",
      description:
        "Controls the position on the menu — lower numbers appear first within the section.",
      group: "ordering",
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seoMetadata",
      description:
        "Optional. Reserved for future individual dish pages — not currently shown on the site, so it is safe to leave blank.",
      group: "seo",
    }),
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
