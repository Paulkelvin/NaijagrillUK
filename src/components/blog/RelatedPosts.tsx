import Link from "next/link";
import { formatDate } from "@/lib/blog/utils";
import type { BlogPostPreview } from "@/sanity/types";

export function RelatedPosts({ posts }: { posts: BlogPostPreview[] }) {
  if (!posts.length) return null;

  return (
    <section className="border-t border-charcoal/10 pt-16">
      <p className="editorial-caption mb-10">Related Articles</p>
      <div className="space-y-10">
        {posts.map((post) => (
          <article key={post._id}>
            <Link href={`/blog/${post.slug}`} className="group block">
              <p className="editorial-caption mb-2">
                {post.category?.title} &middot; {formatDate(post.publishedAt)}
              </p>
              <h3 className="editorial-display text-2xl font-light text-charcoal transition-colors group-hover:text-gold md:text-3xl">
                {post.title}
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone">
                {post.excerpt}
              </p>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
