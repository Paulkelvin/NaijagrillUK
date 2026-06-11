import { Analytics } from "@/components/analytics/Analytics";
import { Footer } from "@/components/layout/Footer";
import { FloatingMobileCta } from "@/components/layout/FloatingMobileCta";
import { Header } from "@/components/layout/Header";
import { JsonLd } from "@/components/seo/JsonLd";
import { AmbientGraphics } from "@/components/ui/AmbientGraphics";
import {
  type OpeningHoursSpecification,
  localBusinessSchema,
  restaurantSchema,
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
        data={[restaurantSchema(), localBusinessSchema(openingHoursSpec)]}
      />
      <AmbientGraphics />
      <Header />
      <main className="flex min-h-screen flex-1 flex-col pb-16 lg:pb-0">
        {children}
      </main>
      <Footer contact={contact} />
      <FloatingMobileCta />
      <Analytics />
    </>
  );
}
