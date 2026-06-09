import { defineField, defineType } from "sanity";

export const testimonial = defineType({
  name: "testimonial",
  title: "Testimonial",
  type: "document",
  fields: [
    defineField({ name: "quote", title: "Quote", type: "text", rows: 4 }),
    defineField({ name: "author", title: "Author", type: "string" }),
    defineField({ name: "context", title: "Context", type: "string" }),
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
    select: { title: "author", subtitle: "context" },
  },
});
