import { CuisineEditorial } from "@/components/home/CuisineEditorial";
import { ExperienceSection } from "@/components/home/ExperienceSection";
import { FaqSection } from "@/components/home/FaqSection";
import { Hero } from "@/components/home/Hero";
// import { NewsletterSection } from "@/components/home/NewsletterSection"; // £10 welcome offer — temporarily disabled
import { PrivateDiningTeaser } from "@/components/home/PrivateDiningTeaser";
import { StorySection } from "@/components/home/StorySection";
import { Testimonials } from "@/components/home/Testimonials";
import { VisitSection } from "@/components/home/VisitSection";
import { Reveal } from "@/components/ui/Reveal";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import { resolveImageSrc } from "@/sanity/resolve-image";
import {
  getHomepage,
  getOpeningHours,
  getTestimonials,
} from "@/sanity/fetch";

export async function generateMetadata() {
  const homepage = await getHomepage();
  return buildMetadata({
    title: homepage.seo?.title,
    description: homepage.seo?.description,
    path: "/",
    seo: homepage.seo,
    image: resolveImageSrc(homepage.heroImage, 1200),
  });
}

export default async function Home() {
  const [homepage, testimonials, hours] = await Promise.all([
    getHomepage(),
    getTestimonials(),
    getOpeningHours(),
  ]);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([{ name: "Home", path: "/" }])}
      />
      <Hero data={homepage} />
      <Reveal><StorySection data={homepage} /></Reveal>
      <Reveal><CuisineEditorial data={homepage} /></Reveal>
      <Reveal><PrivateDiningTeaser /></Reveal>
      <Reveal><ExperienceSection data={homepage} /></Reveal>
      <Reveal><Testimonials items={testimonials} /></Reveal>
      <Reveal><FaqSection /></Reveal>
      {/* £10 welcome offer — temporarily disabled, bring back later */}
      {/* <NewsletterSection /> */}
      <Reveal><VisitSection data={homepage} hours={hours} /></Reveal>
    </>
  );
}
