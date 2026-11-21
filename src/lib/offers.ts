export type OfferCard = {
  id: string;
  big: string;
  small: string;
  title: string;
  body: string;
  image: string;
  alt: string;
};

export type Promotion = {
  startsAt: string;
  endsAt: string;
  endsLabel: string;
  window: string;
  bannerText: string;
  bannerTextShort: string;
  cards: OfferCard[];
  twentyOffDishes: string[];
  terms: string[];
};

// London is on GMT (UTC+0) from late October to late March, so these UTC
// instants are the same as London local time for this promotion.
export const PROMOTION: Promotion = {
  startsAt: "2026-11-22T00:00:00Z",
  endsAt: "2026-12-01T23:59:59Z",
  endsLabel: "1 December",
  window: "22 November to 1 December 2026",
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
    },
    {
      id: "bogof",
      big: "Buy 1",
      small: "get 1 free",
      title: "Jollof or fried rice with peppered meat",
      body: "Choose jollof rice or fried rice with peppered turkey or peppered chicken.",
      image: "/images/menu/naijagrill-jollof-rice-chicken-wings.jpg",
      alt: "Jollof rice with chicken wings",
    },
    {
      id: "puff-puff",
      big: "Free",
      small: "puff puff",
      title: "On any order over £30",
      body: "Spend over £30 and we will add a portion of golden puff puff on the house.",
      image: "/images/menu/naijagrill-puff-puff.jpg",
      alt: "Golden Nigerian puff puff",
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
    "Valid 22 November to 1 December 2026.",
    "Dine-in and in-person collection at the restaurant only. Not available on Uber Eats or delivery.",
    "Soups, ogbono, okro and seafood okro come with your choice of swallow.",
    "Offers cannot be combined with other discounts.",
  ],
};

export type PromotionState = "upcoming" | "active" | "ended";

export function getPromotionState(now: Date = new Date()): PromotionState {
  const time = now.getTime();
  if (time < Date.parse(PROMOTION.startsAt)) return "upcoming";
  if (time > Date.parse(PROMOTION.endsAt)) return "ended";
  return "active";
}

export function getActivePromotion(now: Date = new Date()): Promotion | null {
  return getPromotionState(now) === "active" ? PROMOTION : null;
}
