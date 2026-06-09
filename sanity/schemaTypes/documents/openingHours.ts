import { defineField, defineType } from "sanity";

export const openingHours = defineType({
  name: "openingHours",
  title: "Opening Hours",
  type: "document",
  fields: [
    defineField({
      name: "schedule",
      title: "Weekly Schedule",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "day",
              title: "Day",
              type: "string",
              options: {
                list: [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ],
              },
            }),
            defineField({ name: "open", title: "Opens", type: "string" }),
            defineField({ name: "close", title: "Closes", type: "string" }),
            defineField({
              name: "closed",
              title: "Closed",
              type: "boolean",
              initialValue: false,
            }),
            defineField({
              name: "service",
              title: "Service",
              type: "string",
              options: {
                list: ["Lunch", "Dinner", "All Day"],
              },
            }),
          ],
        },
      ],
    }),
    defineField({
      name: "summary",
      title: "Summary Text",
      type: "string",
      description: 'e.g. "Tuesday — Saturday"',
    }),
    defineField({
      name: "lunchHours",
      title: "Lunch Hours",
      type: "string",
    }),
    defineField({
      name: "dinnerHours",
      title: "Dinner Hours",
      type: "string",
    }),
  ],
  preview: {
    prepare: () => ({ title: "Opening Hours" }),
  },
});
