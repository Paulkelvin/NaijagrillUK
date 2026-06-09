import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";

export function NewsletterSection() {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-[1600px] px-6 py-24 md:px-12 md:py-32 lg:px-16">
        <div className="max-w-2xl">
          <NewsletterSignup source="homepage" />
        </div>
      </div>
    </section>
  );
}
