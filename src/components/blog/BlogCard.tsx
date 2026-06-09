import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/blog/utils";
import { resolveImageSrc } from "@/sanity/resolve-image";
import type { BlogPostPreview } from "@/sanity/types";

export function BlogCard({ post }: { post: BlogPostPreview }) {
  const imageSrc = resolveImageSrc(post.featuredImage, 800);

  return (
    <article className="group">
      <Link href={`/blog/${post.slug}`} className="block">
        {imageSrc && (
          <div className="relative mb-8 aspect-[4/3] overflow-hidden">
            <Image
              src={imageSrc}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        )}
        <p className="editorial-caption mb-3">
          {post.category?.title ?? "Journal"} &middot; {formatDate(post.publishedAt)}
        </p>
        <h2 className="editorial-display text-3xl font-light text-charcoal transition-colors group-hover:text-gold md:text-4xl">
          {post.title}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-stone">{post.excerpt}</p>
        <span className="editorial-link mt-6 inline-block">Read article</span>
      </Link>
    </article>
  );
}
