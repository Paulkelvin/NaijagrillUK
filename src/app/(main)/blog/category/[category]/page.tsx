import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogCard } from "@/components/blog/BlogCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHero } from "@/components/ui/PageHero";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import {
  getBlogCategories,
  getBlogPostsByCategory,
} from "@/sanity/fetch";

type PageProps = {
  params: Promise<{ category: string }>;
};

export async function generateStaticParams() {
  const categories = await getBlogCategories();
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { category: categorySlug } = await params;
  const categories = await getBlogCategories();
  const category = categories.find((c) => c.slug === categorySlug);

  if (!category) return {};

  return buildMetadata({
    title: `${category.title} | Journal`,
    description:
      category.description ??
      `Read ${category.title} articles from NaijaGrill journal.`,
    path: `/blog/category/${category.slug}`,
  });
}

export default async function BlogCategoryPage({ params }: PageProps) {
  const { category: categorySlug } = await params;
  const [categories, posts] = await Promise.all([
    getBlogCategories(),
    getBlogPostsByCategory(categorySlug),
  ]);

  const category = categories.find((c) => c.slug === categorySlug);
  if (!category) notFound();

  return (
    <div className="bg-ivory">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Journal", path: "/blog" },
          { name: category.title, path: `/blog/category/${category.slug}` },
        ])}
      />
      <PageHero
        eyebrow="Journal"
        title={category.title}
        description={category.description ?? "Stories from the NaijaGrill journal."}
        image="https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=2400&q=85"
        imageAlt={`${category.title} journal category`}
        heightClassName="min-h-[58vh]"
      />

      <div className="mx-auto max-w-[1600px] px-6 py-24 md:px-12 md:py-32 lg:px-16">
        <Link href="/blog" className="editorial-link">
          All articles
        </Link>

        <div className="mt-16 grid gap-14 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post._id} post={post} />
          ))}
        </div>

        {!posts.length && (
          <p className="mt-16 text-stone">No articles in this category yet.</p>
        )}
      </div>
    </div>
  );
}
