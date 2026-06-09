import { CuisineEditorial } from "@/components/home/CuisineEditorial";
import { EventsSection } from "@/components/home/EventsSection";
import { ExperienceSection } from "@/components/home/ExperienceSection";
import { Hero } from "@/components/home/Hero";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { StorySection } from "@/components/home/StorySection";
import { Testimonials } from "@/components/home/Testimonials";
import { VisitSection } from "@/components/home/VisitSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import { resolveImageSrc } from "@/sanity/resolve-image";
import {
  getEvents,
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
  const [homepage, testimonials, hours, events] = await Promise.all([
    getHomepage(),
    getTestimonials(),
    getOpeningHours(),
    getEvents(),
  ]);

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([{ name: "Home", path: "/" }])}
      />
      <Hero data={homepage} />
      <StorySection data={homepage} />
      <CuisineEditorial data={homepage} />
      <ExperienceSection data={homepage} />
      <EventsSection events={events} />
      <Testimonials items={testimonials} />
      <NewsletterSection />
      <VisitSection data={homepage} hours={hours} />
    </>
  );
}
