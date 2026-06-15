import { BUSINESS } from "@/lib/business";

export function ShareLinks({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const url = `${BUSINESS.website}/blog/${slug}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="editorial-caption text-stone">Share</span>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-charcoal/15 px-4 py-2 text-xs uppercase tracking-[0.18em] text-charcoal transition-colors hover:border-gold hover:text-gold"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
