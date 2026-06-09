import { defineField, defineType } from "sanity";

export const blogPost = defineType({
  name: "blogPost",
  title: "Blog Post",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string" }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
    }),
    defineField({
      name: "featuredImage",
      title: "Featured Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({ name: "author", title: "Author", type: "string" }),
    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "blogCategory" }],
    }),
    defineField({ name: "excerpt", title: "Excerpt", type: "text", rows: 3 }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [
        {
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "H2", value: "h2" },
            { title: "H3", value: "h3" },
            { title: "Quote", value: "blockquote" },
          ],
        },
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({ name: "alt", type: "string", title: "Alt text" }),
            defineField({ name: "caption", type: "string", title: "Caption" }),
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
    defineField({
      name: "relatedPosts",
      title: "Related Posts",
      type: "array",
      of: [{ type: "reference", to: [{ type: "blogPost" }] }],
    }),
    defineField({
      name: "publishedAt",
      title: "Published At",
      type: "datetime",
    }),
    defineField({ name: "seo", title: "SEO", type: "seoMetadata" }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "author",
      media: "featuredImage",
    },
  },
});
