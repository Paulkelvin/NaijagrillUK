import { Analytics } from "@/components/analytics/Analytics";
import { Footer } from "@/components/layout/Footer";
import { FloatingMobileCta } from "@/components/layout/FloatingMobileCta";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { Header } from "@/components/layout/Header";

export const revalidate = 60;
import { JsonLd } from "@/components/seo/JsonLd";
import { AmbientGraphics } from "@/components/ui/AmbientGraphics";
import {
  type OpeningHoursSpecification,
  localBusinessSchema,
  restaurantSchema,
  websiteSchema,
} from "@/lib/seo/structured-data";
import { getContactInfo, getOpeningHours } from "@/sanity/fetch";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [contact, hours] = await Promise.all([
    getContactInfo(),
    getOpeningHours(),
  ]);

  const openingHoursSpec = hours.schedule
    .filter((day) => !day.closed && day.open && day.close)
    .map<OpeningHoursSpecification>((day) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${day.day}`,
      opens: day.open as string,
      closes: day.close as string,
    }));

  return (
    <>
      <JsonLd
        data={[
          websiteSchema(),
          restaurantSchema(),
          localBusinessSchema(openingHoursSpec),
        ]}
      />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-gold focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-charcoal"
      >
        Skip to content
      </a>
      <AmbientGraphics />
      <Header />
      <main
        id="main-content"
        className="flex min-h-screen flex-1 flex-col pb-16 lg:pb-0"
      >
        {children}
      </main>
      <Footer contact={contact} hours={hours} />
      <FloatingMobileCta />
      <WhatsAppButton />
      <Analytics />
    </>
  );
}
