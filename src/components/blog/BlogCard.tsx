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
  const imageSrc = resolveImageSrc(post.featuredImage, variant === "featured" ? 1400 : 800);
  const isFeatured = variant === "featured";

  return (
    <article className="group">
      <Link
        href={`/blog/${post.slug}`}
        className="relative block overflow-hidden rounded-[1.5rem] bg-charcoal"
      >
        <div
          className={`relative ${
            isFeatured ? "aspect-[16/10] sm:aspect-[2/1]" : "aspect-[10/11]"
          }`}
        >
          {imageSrc && (
            <Image
              src={imageSrc}
              alt={post.title}
              fill
              priority={isFeatured}
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              sizes={
                isFeatured
                  ? "(max-width: 1024px) 100vw, 64vw"
                  : "(max-width: 768px) 100vw, 33vw"
              }
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/95 via-charcoal/60 to-charcoal/15" />
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
            <p className="editorial-caption-light mb-3 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              {post.category?.title ?? "Journal"} &middot;{" "}
              {formatDate(post.publishedAt)}
            </p>
            <h2
              className={`editorial-display leading-[1.02] text-ivory drop-shadow-[0_6px_24px_rgba(0,0,0,0.65)] transition-colors group-hover:text-gold ${
                isFeatured
                  ? "font-light text-4xl md:text-5xl"
                  : "font-semibold tracking-tight text-2xl md:text-3xl"
              }`}
            >
              {post.title}
            </h2>
            <p
              className={`mt-3 leading-[1.55] text-ivory/90 drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)] ${
                isFeatured
                  ? "line-clamp-3 max-w-2xl text-base md:text-lg"
                  : "line-clamp-2 text-sm"
              }`}
            >
              {post.excerpt}
            </p>
            <span className="mt-5 inline-block text-[0.68rem] font-black uppercase tracking-[0.2em] text-gold drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
              Read article
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
