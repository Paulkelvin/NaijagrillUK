import Link from "next/link";
import { BlogCard } from "@/components/blog/BlogCard";
import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import { getBlogCategories, getBlogPosts } from "@/sanity/fetch";

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

  return (
    <div className="bg-ivory pt-32">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Journal", path: "/blog" },
        ])}
      />
      <div className="mx-auto max-w-[1600px] px-6 py-24 md:px-12 md:py-36 lg:px-16">
        <p className="editorial-caption mb-8">Journal</p>
        <h1 className="editorial-display max-w-3xl text-[clamp(2.5rem,5vw,4.5rem)] font-light leading-tight text-charcoal">
          Notes from the kitchen, the city, and the long table.
        </h1>

        <nav
          aria-label="Blog categories"
          className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-[0.6875rem] uppercase tracking-[0.28em] text-stone"
        >
          <Link href="/blog" className="text-charcoal">
            All
          </Link>
          {categories.map((category) => (
            <Link
              key={category._id}
              href={`/blog/category/${category.slug}`}
              className="transition-colors hover:text-gold"
            >
              {category.title}
            </Link>
          ))}
          <Link
            href="/explore-nigerian-cuisine"
            className="transition-colors hover:text-gold"
          >
            Explore Nigerian Cuisine
          </Link>
        </nav>

        <div className="mt-20 grid gap-16 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          {posts.map((post) => (
            <BlogCard key={post._id} post={post} />
          ))}
        </div>

        <div className="mt-32 max-w-2xl border-t border-charcoal/10 pt-16">
          <NewsletterSignup source="blog-index" />
        </div>
      </div>
    </div>
  );
}
