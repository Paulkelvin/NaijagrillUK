import { defineField, defineType } from "sanity";

export const homepage = defineType({
  name: "homepage",
  title: "Homepage",
  type: "document",
  fields: [
    defineField({
      name: "heroEyebrow",
      title: "Hero Eyebrow",
      type: "string",
    }),
    defineField({
      name: "heroHeadline",
      title: "Hero Headline",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "heroSubtext",
      title: "Hero Subtext",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "heroImage",
      title: "Hero Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "storyEyebrow",
      title: "Story Eyebrow",
      type: "string",
    }),
    defineField({
      name: "storyHeadline",
      title: "Story Headline",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "storyParagraphs",
      title: "Story Paragraphs",
      type: "array",
      of: [{ type: "text" }],
    }),
    defineField({
      name: "storyImage",
      title: "Story Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "cuisineEyebrow",
      title: "Cuisine Eyebrow",
      type: "string",
    }),
    defineField({
      name: "cuisineHeadline",
      title: "Cuisine Headline",
      type: "string",
    }),
    defineField({
      name: "cuisineFeatures",
      title: "Cuisine Features",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "title", type: "string", title: "Title" }),
            defineField({ name: "subtitle", type: "string", title: "Subtitle" }),
            defineField({ name: "description", type: "text", title: "Description" }),
            defineField({
              name: "image",
              type: "image",
              title: "Image",
              options: { hotspot: true },
            }),
            defineField({
              name: "align",
              type: "string",
              title: "Image Alignment",
              options: {
                list: [
                  { title: "Left", value: "left" },
                  { title: "Right", value: "right" },
                ],
              },
            }),
          ],
        },
      ],
    }),
    defineField({
      name: "experienceEyebrow",
      title: "Experience Eyebrow",
      type: "string",
    }),
    defineField({
      name: "experienceHeadline",
      title: "Experience Headline",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "experienceBody",
      title: "Experience Body",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "experienceImage",
      title: "Experience Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "visitHeadline",
      title: "Visit Headline",
      type: "string",
    }),
    defineField({
      name: "visitImage",
      title: "Visit Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seoMetadata",
    }),
  ],
  preview: {
    prepare: () => ({ title: "Homepage" }),
  },
});
