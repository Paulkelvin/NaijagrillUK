import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { BUSINESS } from "@/lib/business";
import { buildMetadata } from "@/lib/seo/metadata";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = buildMetadata({
  title: `${BUSINESS.name} | Premium Nigerian Restaurant in Handsworth, Birmingham`,
  description: BUSINESS.description,
  path: "/",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-ivory text-charcoal">
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
