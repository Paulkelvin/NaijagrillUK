import type { FaqItem } from "@/sanity/types";

export function FaqSection({ faqs, title = "Questions" }: { faqs: FaqItem[]; title?: string }) {
  if (!faqs.length) return null;

  return (
    <section className="border-t border-charcoal/10 pt-16">
      <p className="editorial-caption mb-10">{title}</p>
      <div className="space-y-10">
        {faqs.map((faq) => (
          <div key={faq.question}>
            <h3 className="editorial-display text-2xl font-light text-charcoal">
              {faq.question}
            </h3>
            <p className="mt-4 text-base leading-[1.8] text-stone">{faq.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
