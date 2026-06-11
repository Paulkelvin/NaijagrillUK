import Link from "next/link";
import Image from "next/image";
import { BlogCard } from "@/components/blog/BlogCard";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { JsonLd } from "@/components/seo/JsonLd";
import { formatDate } from "@/lib/blog/utils";
import { BUSINESS } from "@/lib/business";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import { getBlogCategories, getBlogPosts } from "@/sanity/fetch";
import { resolveImageSrc } from "@/sanity/resolve-image";

export async function generateMetadata() {
  return buildMetadata({
    title: "Journal",
    description:
      "Stories on Nigerian food, culture, events, and local guides from NaijaGrill, Handsworth, Birmingham.",
    path: "/blog",
  });
}

export default async function BlogPage() {
  const [posts, categories] = await Promise.all([
    getBlogPosts(),
    getBlogCategories(),
  ]);
  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);
  const featuredImage = resolveImageSrc(featuredPost?.featuredImage, 1400);
  const featuredUrl = featuredPost
    ? `${BUSINESS.website}/blog/${featuredPost.slug}`
    : BUSINESS.website;
  const encodedUrl = encodeURIComponent(featuredUrl);
  const encodedTitle = encodeURIComponent(featuredPost?.title ?? "NaijaGrill Journal");

  return (
    <div className="bg-ivory">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Journal", path: "/blog" },
        ])}
      />

      <section className="mx-auto max-w-[1600px] px-6 pb-20 pt-36 md:px-12 md:pb-28 md:pt-44 lg:px-16">
        <div className="mb-14 max-w-5xl">
          <p className="editorial-eyebrow-rule editorial-caption mb-5 text-gold">
            Journal
          </p>
          <h1 className="editorial-display text-balance text-[clamp(2.75rem,5vw,5.35rem)] font-light leading-[0.96] text-charcoal">
            Notes from the kitchen, the city, and the long table.
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-[1.58] text-stone">
            Stories on Nigerian food, culture, celebrations, and the Birmingham
            neighbourhood we call home.
          </p>
        </div>

        {featuredPost && (
          <div className="grid gap-12 lg:grid-cols-[1fr_0.34fr] lg:items-start">
            <article>
              {featuredImage && (
                <Link
                  href={`/blog/${featuredPost.slug}`}
                  className="group block"
                >
                  <div className="image-vignette-side relative aspect-[16/9] overflow-hidden rounded-[2rem] bg-charcoal">
                    <Image
                      src={featuredImage}
                      alt={featuredPost.title}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 64vw"
                      className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.035]"
                    />
                  </div>
                </Link>
              )}
              <div className="mt-10 max-w-3xl">
                <p className="editorial-caption mb-4 text-gold">
                  Featured story &middot; {formatDate(featuredPost.publishedAt)}
                </p>
                <Link href={`/blog/${featuredPost.slug}`} className="group">
                  <h2 className="editorial-display text-5xl font-light leading-[1] text-charcoal transition-colors group-hover:text-gold md:text-6xl">
                    {featuredPost.title}
                  </h2>
                </Link>
                <p className="mt-6 text-base leading-[1.62] text-stone md:text-lg">
                  {featuredPost.excerpt}
                </p>
                <Link
                  href={`/blog/${featuredPost.slug}`}
                  className="luxury-link mt-8"
                >
                  Read article
                </Link>
              </div>
            </article>

            <aside className="space-y-10 lg:sticky lg:top-28">
              <div className="rounded-[1.5rem] border border-charcoal/10 bg-cream/70 p-6">
                <p className="editorial-caption mb-5 text-gold">Share</p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-charcoal/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-charcoal transition-colors hover:border-gold hover:text-gold"
                  >
                    X
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-charcoal/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-charcoal transition-colors hover:border-gold hover:text-gold"
                  >
                    Facebook
                  </a>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-charcoal/10 bg-cream/70 p-6">
                <p className="editorial-caption mb-5 text-gold">Tags</p>
                <nav className="flex flex-wrap gap-3" aria-label="Blog tags">
                  {categories.map((category) => (
                    <Link
                      key={category._id}
                      href={`/blog/category/${category.slug}`}
                      className="rounded-full border border-charcoal/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-charcoal transition-colors hover:border-gold hover:text-gold"
                    >
                      {category.title}
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="rounded-[1.5rem] border border-charcoal/10 bg-cream/70 p-6">
                <p className="editorial-caption mb-5 text-gold">Related</p>
                <div className="space-y-5">
                  {remainingPosts.slice(0, 3).map((post) => (
                    <Link
                      key={post._id}
                      href={`/blog/${post.slug}`}
                      className="group block border-t border-charcoal/10 pt-5 first:border-t-0 first:pt-0"
                    >
                      <p className="editorial-display text-2xl font-light leading-tight text-charcoal transition-colors group-hover:text-gold">
                        {post.title}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-stone">
                        {post.category?.title ?? "Journal"}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-charcoal/10 bg-cream/70 p-6">
                <NewsletterSignup source="blog-index" compact />
              </div>
            </aside>
          </div>
        )}

        <div className="mt-24 border-t border-charcoal/10 pt-16">
          <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="editorial-caption mb-3 text-gold">More stories</p>
              <h2 className="editorial-display text-5xl font-light leading-[0.96] text-charcoal">
                Continue reading.
              </h2>
            </div>
            <nav className="flex flex-wrap gap-3" aria-label="Blog categories">
              <Link
                href="/blog"
                className="rounded-full border border-gold bg-gold px-4 py-2 text-xs uppercase tracking-[0.18em] text-charcoal"
              >
                All
              </Link>
              {categories.map((category) => (
                <Link
                  key={category._id}
                  href={`/blog/category/${category.slug}`}
                  className="rounded-full border border-charcoal/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-charcoal transition-colors hover:border-gold hover:text-gold"
                >
                  {category.title}
                </Link>
              ))}
            </nav>
          </div>

          <div className="grid gap-14 md:grid-cols-2 lg:grid-cols-3">
            {remainingPosts.map((post) => (
              <BlogCard key={post._id} post={post} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
