import { defineField, defineType } from "sanity";

export const contactInfo = defineType({
  name: "contactInfo",
  title: "Contact Information",
  type: "document",
  fields: [
    defineField({ name: "email", title: "Email", type: "string" }),
    defineField({ name: "phone", title: "Phone", type: "string" }),
    defineField({ name: "street", title: "Street", type: "string" }),
    defineField({ name: "area", title: "Area", type: "string" }),
    defineField({ name: "city", title: "City", type: "string" }),
    defineField({ name: "postcode", title: "Postcode", type: "string" }),
    defineField({ name: "country", title: "Country", type: "string" }),
    defineField({
      name: "locationNote",
      title: "Location Note",
      type: "text",
      rows: 3,
      description: "Local SEO copy about Handsworth / Birmingham",
    }),
    defineField({
      name: "instagram",
      title: "Instagram URL",
      type: "url",
    }),
  ],
  preview: {
    prepare: () => ({ title: "Contact Information" }),
  },
});
