const faqs = [
  {
    question: "Is the food suitable for Muslim diners?",
    answer:
      "We cook without pork and without alcohol in our food. We don't hold a formal halal certification at this time, so if you have specific requirements, the best thing to do is ask us directly before you visit or order. Call or WhatsApp us on 07438 757560 and we'll give you a straight answer about what's on the menu.",
  },
  {
    question: "Do I need to book before visiting?",
    answer:
      "Reservations are recommended for evening service, especially Thursday to Saturday. Walk-ins are welcome when the room allows.",
  },
  {
    question: "Can you handle groups, events, or catering?",
    answer:
      "The restaurant seats up to around 25 guests, so smaller groups can dine in with a reservation. For anything larger, NaijaGrill offers full catering for any number of people — and can even arrange and plan the venue for you, like a complete event planner. Send an event and catering enquiry and the team will shape it around your occasion.",
  },
  {
    question: "Can I order NaijaGrill for delivery?",
    answer:
      "Yes. Order your favourites on Uber Eats for delivery across Birmingham, or reserve a table to dine in with us on Rookery Road.",
  },
  {
    question: "Where is NaijaGrill located?",
    answer:
      "You will find us at 77B Rookery Road in Handsworth, Birmingham, close to the neighbourhood's main local routes.",
  },
];

export function FaqSection() {
  return (
    <section className="bg-cream px-6 py-16 md:px-12 md:py-20 lg:px-16">
      <div className="mx-auto max-w-4xl text-center">
        <p className="editorial-caption mb-4 text-gold">Questions</p>
        <h2 className="editorial-display text-5xl font-light leading-[0.96] text-charcoal md:text-6xl">
          Before you take your seat.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-[1.58] text-stone">
          A few notes on reservations, groups and catering, delivery, and
          finding the dining room in Handsworth.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-4xl space-y-4">
        {faqs.map((faq) => (
          <details
            key={faq.question}
            className="group rounded-[1.35rem] bg-ivory px-6 py-5 shadow-[0_18px_60px_rgba(22,15,11,0.07)] open:shadow-[0_24px_80px_rgba(22,15,11,0.1)] md:px-8"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left">
              <span className="editorial-display text-2xl font-light leading-tight text-charcoal md:text-3xl">
                {faq.question}
              </span>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-charcoal/10 text-xl leading-none text-gold transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-open:grid-rows-[1fr]">
              <div className="overflow-hidden">
                <p className="max-w-2xl pt-5 text-sm leading-[1.62] text-stone opacity-0 transition-opacity duration-300 group-open:opacity-100 md:text-base">
                  {faq.answer}
                </p>
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
