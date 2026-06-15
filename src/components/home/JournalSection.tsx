import Link from "next/link";
import { BlogCard } from "@/components/blog/BlogCard";
import type { BlogPostPreview } from "@/sanity/types";

export function JournalSection({ posts }: { posts: BlogPostPreview[] }) {
  const items = posts.slice(0, 3);
  if (items.length === 0) return null;

  return (
    <section className="bg-ivory">
      <div className="mx-auto max-w-[1500px] px-6 py-16 md:px-12 md:py-24 lg:px-16">
        <div className="mb-10 flex flex-col gap-6 border-t border-charcoal/10 pt-10 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="editorial-caption mb-3 text-gold">From the Journal</p>
            <h2 className="editorial-display text-[clamp(2.2rem,6vw,4rem)] font-light leading-[0.96] text-charcoal">
              Stories from the kitchen and the city.
            </h2>
          </div>
          <Link href="/blog" className="editorial-link shrink-0">
            Read the journal
          </Link>
        </div>

        <div className="grid gap-10 md:grid-cols-3">
          {items.map((post) => (
            <BlogCard key={post._id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
