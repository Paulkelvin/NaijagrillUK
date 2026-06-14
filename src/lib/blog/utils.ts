import type { PortableTextBlock } from "@portabletext/types";

const WORDS_PER_MINUTE = 200;

export function calculateReadingTime(blocks: PortableTextBlock[]): number {
  const text = blocks
    .filter((block) => block._type === "block")
    .map((block) =>
      "children" in block
        ? block.children
            ?.map((child) => ("text" in child ? child.text : ""))
            .join(" ")
        : "",
    )
    .join(" ");

  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export function extractHeadings(blocks: PortableTextBlock[]) {
  return blocks
    .filter((block) => block._type === "block" && "style" in block)
    .map((block) => {
      if (!("style" in block) || !("children" in block)) return null;
      if (block.style !== "h2" && block.style !== "h3") return null;

      const text = block.children
        ?.map((child) => ("text" in child ? child.text : ""))
        .join("");

      if (!text) return null;

      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");

      return {
        id,
        text,
        level: block.style === "h2" ? 2 : 3,
      };
    })
    .filter(Boolean) as { id: string; text: string; level: number }[];
}

export function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateString));
}
