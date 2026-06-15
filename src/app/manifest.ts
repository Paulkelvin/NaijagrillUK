import type { MetadataRoute } from "next";
import { BUSINESS } from "@/lib/business";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BUSINESS.name} — Nigerian Restaurant, Handsworth Birmingham`,
    short_name: BUSINESS.name,
    description: BUSINESS.description,
    start_url: "/",
    display: "standalone",
    background_color: "#160f0b",
    theme_color: "#160f0b",
    categories: ["food", "restaurant"],
    icons: [
      { src: "/icon", sizes: "64x64", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
