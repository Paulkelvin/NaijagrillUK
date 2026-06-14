import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCta } from "@/components/blog/ArticleCta";
import { FaqSection } from "@/components/blog/FaqSection";
import { PortableTextContent } from "@/components/blog/PortableTextContent";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { JsonLd } from "@/components/seo/JsonLd";
import { calculateReadingTime, formatDate } from "@/lib/blog/utils";
import { buildMetadata } from "@/lib/seo/metadata";
import {
  articleSchema,
  breadcrumbSchema,
  faqSchema,
} from "@/lib/seo/structured-data";
import { getAllSlugs, getBlogPost } from "@/sanity/fetch";
import { resolveImageSrc } from "@/sanity/resolve-image";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const { blog } = await getAllSlugs();
  return blog.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return {};

  return buildMetadata({
    title: post.seo?.title ?? post.title,
    description: post.seo?.description ?? post.excerpt,
    path: `/blog/${post.slug}`,
    seo: post.seo,
    image: resolveImageSrc(post.featuredImage, 1200),
    type: "article",
    publishedTime: post.publishedAt,
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  const imageSrc = resolveImageSrc(post.featuredImage, 1600);
  const readingTime = calculateReadingTime(post.body);
  const faqJsonLd = faqSchema(post.faqs ?? []);

  return (
    <article className="bg-ivory pt-32">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Journal", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
          articleSchema(post, imageSrc),
          ...(faqJsonLd ? [faqJsonLd] : []),
        ]}
      />

      {imageSrc && (
        <div className="relative h-[55vh] min-h-[420px]">
          <Image
            src={imageSrc}
            alt={post.title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-charcoal/30" />
        </div>
      )}

      <div className="mx-auto max-w-[900px] px-6 py-20 md:px-12 md:py-28">
        <Link href="/blog" className="editorial-link">
          Journal
        </Link>

        <p className="editorial-caption mb-6 mt-12">
          {post.category?.title ?? "Journal"} &middot; {formatDate(post.publishedAt)}{" "}
          &middot; {readingTime} min read
        </p>

        <h1 className="editorial-display text-[clamp(2.5rem,5vw,4rem)] font-light leading-tight text-charcoal">
          {post.title}
        </h1>

        <p className="mt-6 text-sm text-stone">By {post.author}</p>

        <div className="mt-16 grid gap-16 lg:grid-cols-[1fr_220px]">
          <div>
            <PortableTextContent value={post.body} />
            {post.faqs && <FaqSection faqs={post.faqs} />}
            <ArticleCta />
            {post.relatedPosts && (
              <RelatedPosts posts={post.relatedPosts} />
            )}
            <div className="mt-20 border-t border-charcoal/10 pt-16">
              <p className="mb-4 text-sm text-stone">
                Explore more:{" "}
                <Link
                  href="/menu"
                  className="text-charcoal underline decoration-gold/50 underline-offset-4"
                >
                  Our menu
                </Link>
              </p>
            </div>
          </div>

          <aside className="lg:sticky lg:top-32 lg:self-start">
            <TableOfContents body={post.body} />
            <div className="mt-12">
              <NewsletterSignup source={`blog-${post.slug}`} />
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
