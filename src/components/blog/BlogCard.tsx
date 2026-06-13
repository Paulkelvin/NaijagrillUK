import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/blog/utils";
import { resolveImageSrc } from "@/sanity/resolve-image";
import type { BlogPostPreview } from "@/sanity/types";

export function BlogCard({
  post,
  variant = "standard",
}: {
  post: BlogPostPreview;
  variant?: "standard" | "featured";
}) {
  const imageSrc = resolveImageSrc(post.featuredImage, 800);
  const isFeatured = variant === "featured";

  return (
    <article className="group">
      <Link
        href={`/blog/${post.slug}`}
        className={`block ${isFeatured ? "grid gap-10 lg:grid-cols-2 lg:items-end" : ""}`}
      >
        {imageSrc && (
          <div
            className={`relative overflow-hidden rounded-[1.75rem] bg-charcoal ${
              isFeatured ? "aspect-[5/4]" : "mb-8 aspect-[4/3]"
            }`}
          >
            <Image
              src={imageSrc}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/32 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
              <p className="editorial-caption mb-3 text-gold">
                {post.category?.title ?? "Journal"} &middot;{" "}
                {formatDate(post.publishedAt)}
              </p>
              <h2
                className={`editorial-display font-light leading-[1] text-ivory drop-shadow-[0_6px_24px_rgba(0,0,0,0.52)] transition-colors group-hover:text-gold ${
                  isFeatured ? "text-4xl md:text-5xl" : "text-3xl md:text-4xl"
                }`}
              >
                {post.title}
              </h2>
            </div>
          </div>
        )}
        <div>
          <p className="editorial-caption mb-3">
            {post.category?.title ?? "Journal"} &middot;{" "}
            {formatDate(post.publishedAt)}
          </p>
          {!imageSrc && (
            <h2
              className={`editorial-display font-light text-charcoal transition-colors group-hover:text-gold ${
                isFeatured
                  ? "text-5xl leading-tight md:text-6xl"
                  : "text-3xl md:text-4xl"
              }`}
            >
              {post.title}
            </h2>
          )}
          <p
            className={`mt-4 leading-relaxed text-stone ${
              isFeatured ? "max-w-xl text-lg" : "text-base"
            }`}
          >
            {post.excerpt}
          </p>
          <span className="editorial-link mt-8 inline-block">Read article</span>
        </div>
      </Link>
    </article>
  );
}
