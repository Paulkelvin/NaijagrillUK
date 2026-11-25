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

export type BulkOption = { size: string; note?: string; price: number };
export type BulkItem = { name: string; options: BulkOption[]; note?: string };
export type BulkGroup = {
  id: string;
  title: string;
  blurb: string;
  image: string;
  alt: string;
  items: BulkItem[];
};

const L = (litres: number, price: number): BulkOption => ({ size: `${litres} litre${litres > 1 ? "s" : ""}`, price });
const HALF = (price: number): BulkOption => ({ size: "Half cooler", note: "12 litres", price });
const FULL = (price: number): BulkOption => ({ size: "Full cooler", note: "24 litres", price });
const PCS = (n: number, price: number): BulkOption => ({ size: `${n} pieces`, price });

// Festive bulk orders: priced per litre / cooler / pieces. Placed by
// WhatsApp or phone, so these are not on the Uber Eats menu.
export const FESTIVE = {
  eyebrow: "The festive season",
  title: "Festive feasts, by the litre.",
  intro:
    "From office parties to family feasts, let us handle the heavy lifting with bulk festive orders.",
  bonusThreshold: 100,
  bonusItems: ["Small chops", "Puff puff", "Samosas", "Spring rolls"],
  groups: [
    {
      id: "rice",
      title: "Party rice",
      blurb: "The centrepiece of every table.",
      image: "/images/menu/naijagrill-jollof-rice-plantain-assorted-meat.jpg",
      alt: "Jollof rice with plantain and assorted meat",
      items: [
        { name: "Jollof rice", options: [L(2, 15), L(5, 35), HALF(65), FULL(120)] },
        { name: "Fried rice with prawns", options: [L(2, 20), L(5, 40), HALF(70), FULL(130)] },
      ],
    },
    {
      id: "stews",
      title: "Stews & soups",
      blurb: "Rich, slow-cooked and made for sharing.",
      image: "/images/menu/naijagrill-poundo-egusi-soup.jpg",
      alt: "Egusi soup with pounded yam",
      items: [
        { name: "Ayamase stew", options: [L(2, 40), L(5, 90)] },
        { name: "Ofada stew", options: [L(2, 40), L(5, 90)] },
        { name: "Efo riro", options: [L(2, 40), L(5, 90)] },
        { name: "Efo egusi", options: [L(2, 40), L(5, 90)] },
        { name: "Seafood okro", options: [L(2, 35), L(5, 80)] },
        { name: "Assorted meats, stewed", options: [L(2, 40), L(5, 90)] },
      ],
    },
    {
      id: "peppered",
      title: "Peppered & grilled",
      blurb: "Bold, hot and gone in minutes.",
      image: "/images/menu/naijagrill-peppered-beef.jpg",
      alt: "Peppered beef in a wooden bowl",
      items: [
        { name: "Gizdodo", options: [L(1, 20), L(2, 35), L(5, 80)] },
        { name: "Asun", options: [L(1, 20), L(2, 35), L(5, 80)] },
        { name: "Peppered beef", options: [PCS(20, 50), PCS(40, 95)] },
        { name: "Peppered chicken", options: [PCS(20, 30), PCS(40, 55)] },
        { name: "Peppered turkey", options: [PCS(20, 50), PCS(40, 95)] },
        { name: "Peppered hake fish", options: [PCS(20, 40), PCS(40, 75)] },
      ],
    },
    {
      id: "sides",
      title: "Sides",
      blurb: "Add them to any order.",
      image: "/images/menu/naijagrill-pounded-yam-efo-riro.jpg",
      alt: "Pounded yam with efo riro",
      items: [
        { name: "Moin moin", options: [{ size: "Per cupcake", price: 2 }] },
        { name: "Pounded yam", options: [{ size: "Per wrap", price: 2 }] },
      ],
    },
  ] satisfies BulkGroup[],
  steps: [
    { step: "1", title: "Choose your dishes", body: "Pick the dishes and sizes from the price list." },
    { step: "2", title: "Message us", body: "Tell us what you need, how many you are feeding and when." },
    { step: "3", title: "We prepare it", body: "We confirm your order and have it ready for you." },
  ],
  terms: [
    "Festive bulk orders are placed by WhatsApp or phone and are not on Uber Eats.",
    "Prices are per portion size shown. Please message us to confirm availability and timing.",
  ],
} as const;

export function formatPrice(price: number) {
  return `£${price}`;
}

export const HOW_IT_WORKS = [
  { step: "1", title: "Pick your dishes", body: "Browse the menu or just tell us what you fancy." },
  { step: "2", title: "Order with us", body: "Dine in, or message us on WhatsApp and collect in person." },
  { step: "3", title: "Mention the offer", body: "We take it off your bill. No codes, no vouchers." },
] as const;

export const OFFER_FAQS = [
  {
    q: "How do I place a festive bulk order?",
    a: "Message us on WhatsApp or call. Tell us the dishes and sizes you want, how many you are feeding and when you need it, and we will confirm.",
  },
  {
    q: "What comes with orders over £100?",
    a: "Festive bulk orders over £100 come with small chops, puff puff, samosas and spring rolls.",
  },
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
  bannerText: "Festive bulk orders & 20% off dine-in",
  bannerTextShort: "Festive bulk orders & offers",
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
