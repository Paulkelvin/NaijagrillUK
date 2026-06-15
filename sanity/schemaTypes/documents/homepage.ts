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
      title: "Story Image",
      type: "image",
      options: { hotspot: true },
      fields: [defineField({ name: "alt", title: "Alt text", type: "string" })],
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
      name: "videoEyebrow",
      title: "Video Eyebrow",
      type: "string",
    }),
    defineField({
      name: "videoHeadline",
      title: "Video Headline",
      type: "string",
    }),
    defineField({
      name: "videoBody",
      title: "Video Body",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "videos",
      title: "Homepage Videos",
      description:
        "Paste one or more YouTube links (Short, watch, or youtu.be). Leave empty to hide the homepage video section.",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "videoFile",
              title: "Video file (recommended)",
              description:
                "Upload an MP4 to host the video here with no YouTube branding. Takes priority over the YouTube URL below.",
              type: "file",
              options: { accept: "video/mp4,video/webm,video/quicktime" },
            }),
            defineField({
              name: "poster",
              title: "Poster image",
              description: "Thumbnail shown before the video plays.",
              type: "image",
              options: { hotspot: true },
              fields: [
                defineField({ name: "alt", title: "Alt text", type: "string" }),
              ],
            }),
            defineField({
              name: "orientation",
              title: "Orientation",
              type: "string",
              initialValue: "portrait",
              options: {
                list: [
                  { title: "Portrait (9:16)", value: "portrait" },
                  { title: "Landscape (16:9)", value: "landscape" },
                ],
                layout: "radio",
              },
            }),
            defineField({
              name: "url",
              title: "YouTube URL (fallback)",
              description: "Used only when no video file is uploaded.",
              type: "url",
            }),
            defineField({
              name: "title",
              title: "Caption (optional)",
              type: "string",
            }),
          ],
          preview: { select: { title: "title", subtitle: "url", media: "poster" } },
        },
      ],
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
