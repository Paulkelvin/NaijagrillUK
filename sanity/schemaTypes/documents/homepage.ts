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
      name: "heroVideo",
      title: "Hero Video (self-hosted)",
      description:
        "Background video for the homepage hero. Plays muted, looped, and autoplays. Uploaded MP4 (H.264) recommended. When set, it replaces the Hero Image.",
      type: "file",
      options: { accept: "video/mp4,video/webm,video/quicktime" },
    }),
    defineField({
      name: "heroVideoMobile",
      title: "Hero Video — Mobile (optional, smaller file)",
      description:
        "Optional lighter/smaller version of the Hero Video shown on phones to save data. Falls back to the main Hero Video if not set.",
      type: "file",
      options: { accept: "video/mp4,video/webm,video/quicktime" },
    }),
    defineField({
      name: "heroImage",
      title: "Hero Image / Video Poster",
      description:
        "Shown in the hero. Also used as the poster (still frame) while the Hero Video loads, and as the fallback when no video is set.",
      type: "image",
      options: { hotspot: true },
      fields: [defineField({ name: "alt", title: "Alt text", type: "string" })],
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
      title: "Story Image / Video Poster",
      description:
        "Shown in the Our Story section. Also used as the poster for the Story video below.",
      type: "image",
      options: { hotspot: true },
      fields: [defineField({ name: "alt", title: "Alt text", type: "string" })],
    }),
    defineField({
      name: "storyVideo",
      title: "Story Video (self-hosted)",
      description:
        "Upload an MP4 for the Our Story section. Plays with no cookie prompt. Replaces the embedded video when set.",
      type: "file",
      options: { accept: "video/mp4,video/webm,video/quicktime" },
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
              fields: [
                defineField({ name: "alt", title: "Alt text", type: "string" }),
              ],
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
      fields: [defineField({ name: "alt", title: "Alt text", type: "string" })],
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
      fields: [defineField({ name: "alt", title: "Alt text", type: "string" })],
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
