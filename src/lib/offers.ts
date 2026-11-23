export type OfferCard = {
  id: string;
  big: string;
  small: string;
  title: string;
  body: string;
  image: string;
  alt: string;
  tag: string;
  claim: string;
};

export type Promotion = {
  bannerText: string;
  bannerTextShort: string;
  cards: OfferCard[];
  twentyOffDishes: string[];
  terms: string[];
};

// Flip to false to hide every offer across the site (header strip, hero badge,
// homepage section and the /offers page). There is no date window: the offers
// run until this is switched off.
export const OFFERS_ACTIVE = true;

export const HOW_IT_WORKS = [
  { step: "1", title: "Pick your dishes", body: "Browse the menu or just tell us what you fancy." },
  { step: "2", title: "Order with us", body: "Dine in, or message us on WhatsApp and collect in person." },
  { step: "3", title: "Mention the offer", body: "We take it off your bill. No codes, no vouchers." },
] as const;

export const OFFER_FAQS = [
  {
    q: "Can I use these offers on Uber Eats?",
    a: "No. The offers are for dine-in and in-person collection at the restaurant only, not Uber Eats or delivery.",
  },
  {
    q: "Do I need a code or voucher?",
    a: "No. Just mention the offer when you order and we will apply it.",
  },
  {
    q: "Can I combine two offers?",
    a: "Offers cannot be combined with other discounts. Ask us if you are unsure and we will tell you what works best for your order.",
  },
  {
    q: "Can I order ahead and collect?",
    a: "Yes. Message us on WhatsApp or call, tell us what you would like and the time you will arrive, then collect in person and mention the offer.",
  },
] as const;

export const PROMOTION: Promotion = {
  bannerText: "20% off when you dine in or collect",
  bannerTextShort: "20% off dine-in & collection",
  cards: [
    {
      id: "twenty-off",
      big: "20%",
      small: "off",
      title: "Soups, swallows and stews",
      body: "Efo riro, egusi, ogbono, okro, seafood okro, ayamase, ofada and the chops platter.",
      image: "/images/menu/naijagrill-pounded-yam-efo-riro.jpg",
      alt: "Pounded yam with efo riro vegetable soup",
      tag: "Dine-in & collection",
      claim: "Order any of these dishes at the restaurant and the 20% comes off your bill.",
    },
    {
      id: "bogof",
      big: "Buy 1",
      small: "get 1 free",
      title: "Jollof or fried rice with peppered meat",
      body: "Choose jollof rice or fried rice with peppered turkey or peppered chicken.",
      image: "/images/menu/naijagrill-jollof-rice-chicken-wings.jpg",
      alt: "Jollof rice with chicken wings",
      tag: "Rice & peppered meat",
      claim: "Order one jollof or fried rice with peppered chicken or turkey and ask for your free one.",
    },
    {
      id: "puff-puff",
      big: "Free",
      small: "puff puff",
      title: "On any order over £30",
      body: "Spend over £30 and we will add a portion of golden puff puff on the house.",
      image: "/images/menu/naijagrill-puff-puff.jpg",
      alt: "Golden Nigerian puff puff",
      tag: "Orders over £30",
      claim: "Spend over £30 and ask for your free puff puff when you order.",
    },
  ],
  twentyOffDishes: [
    "Efo riro with assorted meats",
    "Egusi with assorted meats",
    "Ogbono with assorted meat",
    "Okro with assorted meat",
    "Seafood okro",
    "Chops platter",
    "Ayamase with white rice",
    "Ofada with white rice",
  ],
  terms: [
    "Dine-in and in-person collection at the restaurant only. Not available on Uber Eats or delivery.",
    "Soups, ogbono, okro and seafood okro come with your choice of swallow.",
    "Offers cannot be combined with other discounts.",
    "Offers are for a limited time and may change without notice.",
  ],
};

export function getActivePromotion(): Promotion | null {
  return OFFERS_ACTIVE ? PROMOTION : null;
}
