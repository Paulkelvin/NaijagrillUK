import { defineField, defineType } from "sanity";

export const explorePage = defineType({
  name: "explorePage",
  title: "Explore Nigerian Cuisine",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string" }),
    defineField({ name: "subtitle", title: "Subtitle", type: "text", rows: 2 }),
    defineField({
      name: "heroImage",
      title: "Hero Image",
      type: "image",
      options: { hotspot: true },
      fields: [defineField({ name: "alt", title: "Alt text", type: "string" })],
    }),
    defineField({
      name: "introduction",
      title: "Introduction",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "sections",
      title: "Content Sections",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "heading", type: "string", title: "Heading" }),
            defineField({
              name: "body",
              type: "array",
              title: "Body",
              of: [{ type: "block" }],
            }),
            defineField({
              name: "image",
              type: "image",
              title: "Image",
              options: { hotspot: true },
              fields: [
                defineField({ name: "alt", title: "Alt text", type: "string" }),
              ],
            }),
            defineField({
              name: "imagePosition",
              type: "string",
              title: "Image Position",
              options: {
                list: [
                  { title: "Left", value: "left" },
                  { title: "Right", value: "right" },
                  { title: "Full Width", value: "full" },
                ],
              },
            }),
          ],
        },
      ],
    }),
    defineField({
      name: "faqs",
      title: "FAQ Section",
      type: "array",
      of: [{ type: "faqItem" }],
    }),
    defineField({ name: "seo", title: "SEO", type: "seoMetadata" }),
  ],
  preview: {
    prepare: () => ({ title: "Explore Nigerian Cuisine" }),
  },
});
