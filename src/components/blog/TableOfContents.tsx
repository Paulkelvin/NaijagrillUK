import type { PortableTextBlock } from "@portabletext/types";
import { extractHeadings } from "@/lib/blog/utils";

export function TableOfContents({ body }: { body: PortableTextBlock[] }) {
  const headings = extractHeadings(body);
  if (!headings.length) return null;

  return (
    <nav aria-label="Table of contents" className="border-t border-charcoal/10 pt-8">
      <p className="editorial-caption mb-6">Contents</p>
      <ol className="space-y-3">
        {headings.map((heading) => (
          <li
            key={heading.id}
            className={heading.level === 3 ? "pl-4" : ""}
          >
            <a
              href={`#${heading.id}`}
              className="text-sm text-stone transition-colors hover:text-gold"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
