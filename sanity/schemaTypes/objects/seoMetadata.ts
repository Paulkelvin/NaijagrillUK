import { defineField, defineType } from "sanity";

export const seoMetadata = defineType({
  name: "seoMetadata",
  title: "SEO Metadata",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "SEO Title",
      type: "string",
      description:
        "The blue clickable headline in Google results. Aim for ~50–60 characters and include the key term + brand, e.g. “Nigerian Catering Birmingham | NaijaGrill”. Leave blank to use the page’s normal title.",
      validation: (rule) =>
        rule.max(70).warning("Keep under ~60 characters so Google doesn’t cut it off."),
    }),
    defineField({
      name: "description",
      title: "SEO Description",
      type: "text",
      rows: 3,
      description:
        "The grey summary under the title in Google. Write one compelling sentence (~150–160 characters) with a reason to click and your location/keywords.",
      validation: (rule) =>
        rule.max(160).warning("Keep under 160 characters so it isn’t truncated."),
    }),
    defineField({
      name: "ogImage",
      title: "Open Graph Image",
      type: "image",
      description:
        "The preview image when this page is shared on WhatsApp, Facebook, etc. Best at 1200×630. Leave blank to use the site’s default share image.",
      options: { hotspot: true },
    }),
    defineField({
      name: "noIndex",
      title: "Hide from search engines",
      type: "boolean",
      description:
        "Turn ON only to keep this page out of Google. Leave OFF for normal pages you want found.",
      initialValue: false,
    }),
  ],
});
