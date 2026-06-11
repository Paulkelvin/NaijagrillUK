import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup";
import { EditorialImage } from "@/components/ui/EditorialImage";

export function NewsletterSection() {
  return (
    <section className="bg-cream px-6 py-16 md:px-12 md:py-20 lg:px-16">
      <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[2rem] bg-charcoal text-ivory shadow-[0_30px_90px_rgba(22,15,11,0.18)]">
        <div className="grid min-h-[430px] lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative z-10 flex flex-col justify-center px-7 py-12 md:px-12 lg:px-16">
            <p className="editorial-caption mb-5 text-gold">Welcome offer</p>
            <NewsletterSignup source="homepage" variant="dark" />
            <p className="mt-6 max-w-md text-xs uppercase tracking-[0.18em] text-ivory/42">
              First-visit offer sent by email. One per guest.
            </p>
          </div>

          <div className="relative hidden min-h-[320px] overflow-hidden lg:block lg:min-h-full">
            <EditorialImage
              src="https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=1800&q=85"
              alt="Nigerian food served for a welcome offer"
              sizes="(max-width: 1024px) 100vw, 52vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/20 to-transparent" />
            <div className="absolute bottom-8 right-8 hidden h-28 w-28 rounded-[2rem] border border-gold/35 lg:block" />
          </div>
        </div>
      </div>
    </section>
  );
}
