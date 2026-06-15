import type { ReactNode } from "react";
import { EditorialImage } from "./EditorialImage";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description?: string;
  image: string;
  imageAlt: string;
  align?: "left" | "center";
  heightClassName?: string;
  children?: ReactNode;
};

export function PageHero({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  align = "left",
  heightClassName = "min-h-[72vh]",
  children,
}: PageHeroProps) {
  const centered = align === "center";

  return (
    <section className={`relative overflow-hidden ${heightClassName}`}>
      <div className="image-vignette absolute inset-0">
        <EditorialImage src={image} alt={imageAlt} priority sizes="100vw" />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(209,154,58,0.22),transparent_34%),linear-gradient(90deg,rgba(22,15,11,0.78),rgba(22,15,11,0.36),rgba(22,15,11,0.68))]" />
      <div className="relative mx-auto flex min-h-[inherit] max-w-[1600px] items-end px-6 pb-16 pt-44 md:px-12 md:pb-20 lg:px-16">
        <div
          className={`animate-rise w-full ${
            centered ? "mx-auto max-w-4xl text-center" : "max-w-4xl"
          }`}
        >
          <p
            className={`image-text-contrast mb-4 text-[0.6875rem] font-semibold uppercase tracking-[0.24em] text-ivory/95 ${
              centered ? "" : "editorial-eyebrow-rule"
            }`}
          >
            {eyebrow}
          </p>
          <h1 className="editorial-display image-text-contrast text-balance text-[clamp(2.75rem,5.2vw,4.95rem)] font-light leading-[0.94] tracking-tight text-ivory">
            {title}
          </h1>
          {description && (
            <p
              className={`image-text-contrast mt-6 text-base font-medium leading-[1.6] text-ivory/94 md:text-lg ${
                centered ? "mx-auto max-w-2xl" : "max-w-2xl"
              }`}
            >
              {description}
            </p>
          )}
          {children && <div className="mt-12">{children}</div>}
        </div>
      </div>
    </section>
  );
}
