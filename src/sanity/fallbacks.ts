import { BUSINESS } from "@/lib/business";
import type {
  BlogCategoryData,
  BlogPostData,
  BlogPostPreview,
  ContactInfoData,
  EventData,
  ExplorePageData,
  GalleryImageData,
  HomepageData,
  MenuItemData,
  OpeningHoursData,
  TestimonialData,
} from "./types";

export const fallbackHomepage: HomepageData = {
  heroEyebrow: "Handsworth · Birmingham · Nigerian Cuisine",
  heroHeadline: "Fire, flavour,\nand the long table.",
  heroSubtext:
    "A premium dining room celebrating the depth of Nigerian cooking — slow smoke, bold spice, and the generosity of shared plates.",
  heroImage: "/images/naija-grill-and-spice-hero.jpg",
  storyEyebrow: "Our Story",
  storyHeadline: "Not a trend.\nA tradition carried forward.",
  storyParagraphs: [
    "Naija Grill was born from a simple conviction: Nigerian food belongs among Birmingham's finest tables — not as novelty, but as cuisine with history, technique, and soul.",
    "We cook over open flame, honour regional recipes, and plate with the restraint of a luxury dining room. Every dish is an invitation to linger.",
  ],
  storyImage:
    "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=85",
  cuisineEyebrow: "From the Kitchen",
  cuisineHeadline: "Dishes that command the room.",
  cuisineFeatures: [
    {
      title: "Jollof",
      subtitle: "The ceremony of the pot",
      description:
        "Long-simmered tomato base, wood smoke, and rice that holds its grain. Served as the centrepiece of the table.",
      image:
        "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=1400&q=85",
      align: "left",
    },
    {
      title: "Suya",
      subtitle: "Street fire, refined",
      description:
        "Peanut-spiced beef, kissed by charcoal. Thinly sliced, deeply aromatic — a study in heat and texture.",
      image:
        "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1400&q=85",
      align: "right",
    },
  ],
  experienceEyebrow: "The Experience",
  experienceHeadline: "An evening measured in conversation, not courses.",
  experienceBody:
    "Low light. Unhurried service. Music that sits beneath the room rather than above it. We design each service for guests who want to arrive, settle, and stay.",
  experienceImage: "/images/naija-grill-and-spice.jpg",
  visitHeadline: "Your table awaits.",
  visitImage:
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1400&q=85",
  seo: {
    title: "NaijaGrill | Premium Nigerian Restaurant in Handsworth, Birmingham",
    description: BUSINESS.description,
  },
};

export const fallbackMenuItems: MenuItemData[] = [
  {
    _id: "menu-white-rice-ofada-stew",
    title: "White Rice with Ofada Stew",
    description:
      "Steamed white rice with rich ofada sauce, peppers, locust beans, and assorted meat.",
    price: 14.99,
    section: "rice-specials",
    image: "/images/menu/naijagrill-white-rice-ofada-stew.jpg",
    localImage: "/images/menu/naijagrill-white-rice-ofada-stew.jpg",
    badge: "Featured",
    orderable: true,
    uberEatsUrl: BUSINESS.order.uberEatsUrl,
    order: 1,
    seo: {
      title: "White Rice with Ofada Stew | NaijaGrill Birmingham",
      description:
        "Order white rice with ofada stew from NaijaGrill in Handsworth, Birmingham.",
    },
  },
  {
    _id: "menu-white-rice-ayamase",
    title: "White Rice with Ayamase",
    description:
      "Green pepper stew with deep savoury heat, served over fluffy white rice.",
    price: 14.99,
    section: "rice-specials",
    image: "/images/menu/naijagrill-white-rice-ayamase-stew.jpg",
    localImage: "/images/menu/naijagrill-white-rice-ayamase-stew.jpg",
    badge: "Delivery favourite",
    orderable: true,
    uberEatsUrl: BUSINESS.order.uberEatsUrl,
    order: 2,
    seo: {
      title: "White Rice with Ayamase | NaijaGrill Birmingham",
      description:
        "Order white rice with ayamase, a rich Nigerian green pepper stew, from NaijaGrill.",
    },
  },
  {
    _id: "menu-jollof-rice",
    title: "Jollof Rice",
    description:
      "Party-style tomato rice with smoky pepper flavour, plantain, and your choice of protein.",
    price: 12.99,
    section: "rice-specials",
    image: "/images/menu/naijagrill-jollof-rice-plantain-assorted-meat.jpg",
    localImage: "/images/menu/naijagrill-jollof-rice-plantain-assorted-meat.jpg",
    orderable: true,
    uberEatsUrl: BUSINESS.order.uberEatsUrl,
    order: 3,
  },
  {
    _id: "menu-fried-rice",
    title: "Fried Rice",
    description:
      "Colourful Nigerian fried rice with vegetables, peppered fish, and caramelised plantain.",
    price: 12.99,
    section: "rice-specials",
    image: "/images/menu/naijagrill-fried-rice-peppered-hake-plantain.jpg",
    localImage: "/images/menu/naijagrill-fried-rice-peppered-hake-plantain.jpg",
    orderable: true,
    uberEatsUrl: BUSINESS.order.uberEatsUrl,
    order: 4,
  },
  {
    _id: "menu-poundo-egusi",
    title: "Poundo with Egusi",
    description:
      "Soft poundo served with melon seed egusi soup, greens, stockfish, and tender meat.",
    price: 16.99,
    section: "soups-swallows",
    image: "/images/menu/naijagrill-poundo-egusi-soup.jpg",
    localImage: "/images/menu/naijagrill-poundo-egusi-soup.jpg",
    badge: "Featured",
    orderable: true,
    uberEatsUrl: BUSINESS.order.uberEatsUrl,
    order: 5,
    seo: {
      title: "Poundo with Egusi | NaijaGrill Birmingham",
      description:
        "Order poundo with egusi soup, a Nigerian soup and swallow favourite, from NaijaGrill.",
    },
  },
  {
    _id: "menu-efo-riro",
    title: "Efo Riro",
    description:
      "Spinach stew cooked with peppers, iru, palm oil, and your chosen protein.",
    price: 14.99,
    section: "soups-swallows",
    image: "/images/menu/naijagrill-efo-riro-soup.jpg",
    localImage: "/images/menu/naijagrill-efo-riro-soup.jpg",
    orderable: true,
    uberEatsUrl: BUSINESS.order.uberEatsUrl,
    order: 6,
  },
  {
    _id: "menu-assorted-meat-pepper-soup",
    title: "Assorted Meat Pepper Soup",
    description:
      "Aromatic pepper soup with mixed meats, herbs, chilli, and warming spice.",
    price: 13.99,
    section: "seafood-pepper",
    image: "/images/menu/naijagrill-assorted-meat-pepper-soup.jpg",
    localImage: "/images/menu/naijagrill-assorted-meat-pepper-soup.jpg",
    badge: "Featured",
    orderable: true,
    uberEatsUrl: BUSINESS.order.uberEatsUrl,
    order: 7,
    seo: {
      title: "Assorted Meat Pepper Soup | NaijaGrill Birmingham",
      description:
        "Order assorted meat pepper soup from NaijaGrill in Handsworth, Birmingham.",
    },
  },
  {
    _id: "menu-peppered-hake-fish",
    title: "Peppered Hake Fish",
    description:
      "Hake fish in a bold pepper sauce with fried rice, plantain, onions, and peppers.",
    price: 15.99,
    section: "seafood-pepper",
    image: "/images/menu/naijagrill-fried-rice-peppered-hake-plantain.jpg",
    localImage: "/images/menu/naijagrill-fried-rice-peppered-hake-plantain.jpg",
    badge: "Featured",
    orderable: true,
    uberEatsUrl: BUSINESS.order.uberEatsUrl,
    order: 8,
    seo: {
      title: "Peppered Hake Fish | NaijaGrill Birmingham",
      description:
        "Order peppered hake fish with Nigerian sides from NaijaGrill.",
    },
  },
  {
    _id: "menu-grilled-tilapia",
    title: "Grilled Tilapia",
    description:
      "Whole tilapia grilled with peppers, onions, herbs, chips, and plantain on the side.",
    price: 18.99,
    section: "seafood-pepper",
    image: "/images/menu/naijagrill-grilled-tilapia-plantain-chips.jpg",
    localImage: "/images/menu/naijagrill-grilled-tilapia-plantain-chips.jpg",
    orderable: true,
    uberEatsUrl: BUSINESS.order.uberEatsUrl,
    order: 9,
  },
  {
    _id: "menu-beef-suya",
    title: "Beef Suya",
    description:
      "Thin-cut beef coated in yaji spice, grilled hot, and finished with onions.",
    price: 10.99,
    section: "grill-suya",
    image:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1400&q=85",
    badge: "Featured",
    orderable: true,
    uberEatsUrl: BUSINESS.order.uberEatsUrl,
    order: 10,
    seo: {
      title: "Beef Suya | NaijaGrill Birmingham",
      description:
        "Order beef suya with yaji spice from NaijaGrill in Handsworth, Birmingham.",
    },
  },
  {
    _id: "menu-chicken-suya",
    title: "Chicken Suya",
    description:
      "Grilled chicken with suya spice, fresh onions, tomatoes, and chilli.",
    price: 10.99,
    section: "grill-suya",
    image:
      "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=1400&q=85",
    orderable: true,
    uberEatsUrl: BUSINESS.order.uberEatsUrl,
    order: 11,
  },
  {
    _id: "menu-suya-chicken-wings",
    title: "Suya Chicken Wings",
    description:
      "Crispy wings tossed with suya seasoning and served with a pepper dip.",
    price: 8.99,
    section: "grill-suya",
    image:
      "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=1400&q=85",
    orderable: true,
    uberEatsUrl: BUSINESS.order.uberEatsUrl,
    order: 12,
  },
  {
    _id: "menu-small-chops",
    title: "Small Chops Platter",
    description:
      "Puff puff, chicken, samosas, and snackable bites for the table or delivery bag.",
    price: 9.99,
    section: "small-chops",
    image: "/images/menu/naijagrill-small-chops-platter.jpg",
    localImage: "/images/menu/naijagrill-small-chops-platter.jpg",
    orderable: true,
    uberEatsUrl: BUSINESS.order.uberEatsUrl,
    order: 13,
  },
  {
    _id: "menu-puff-puff",
    title: "Puff Puff",
    description:
      "Golden sweet dough bites, soft inside and perfect before the main order.",
    price: 4.99,
    section: "small-chops",
    image: "/images/menu/naijagrill-small-chops-platter.jpg",
    localImage: "/images/menu/naijagrill-small-chops-platter.jpg",
    orderable: true,
    uberEatsUrl: BUSINESS.order.uberEatsUrl,
    order: 14,
  },
  {
    _id: "menu-beans-plantain",
    title: "Beans with Plantain",
    description:
      "Stewed beans served with sweet fried plantain and a spoon of pepper sauce.",
    price: 8.99,
    section: "sides-drinks",
    image: "/images/menu/naijagrill-beans-plantain-pepper-sauce.jpg",
    localImage: "/images/menu/naijagrill-beans-plantain-pepper-sauce.jpg",
    orderable: true,
    uberEatsUrl: BUSINESS.order.uberEatsUrl,
    order: 15,
  },
  {
    _id: "menu-fried-plantain",
    title: "Fried Plantain",
    description: "Sweet ripe plantain fried until caramelised at the edges.",
    price: 4.99,
    section: "sides-drinks",
    image: "/images/menu/naijagrill-beans-plantain-pepper-sauce.jpg",
    localImage: "/images/menu/naijagrill-beans-plantain-pepper-sauce.jpg",
    orderable: true,
    uberEatsUrl: BUSINESS.order.uberEatsUrl,
    order: 16,
  },
  {
    _id: "menu-soft-drinks",
    title: "Soft Drinks",
    description: "Cold drinks to balance pepper soup, suya, and rice plates.",
    price: 2.5,
    section: "sides-drinks",
    image:
      "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=1400&q=85",
    orderable: true,
    uberEatsUrl: BUSINESS.order.uberEatsUrl,
    order: 17,
  },
];

export const fallbackTestimonials: TestimonialData[] = [
  {
    _id: "1",
    quote:
      "The jollof alone would justify the journey across Birmingham. Everything else felt like a generous afterthought.",
    author: "Elena M.",
    context: "Evening service",
  },
  {
    _id: "2",
    quote:
      "Finally — Nigerian food presented with the same care you expect from the city's best dining rooms.",
    author: "James O.",
    context: "Private dining",
  },
  {
    _id: "3",
    quote:
      "No gimmicks. Just extraordinary flavour, beautiful plating, and a room that knows when to step back.",
    author: "Amara K.",
    context: "Weekend lunch",
  },
];

export const fallbackOpeningHours: OpeningHoursData = {
  summary: "Open every day · Sunday — Saturday",
  lunchHours: "2pm — 11pm",
  dinnerHours: "2pm — 11pm",
  schedule: [
    { day: "Monday", open: "14:00", close: "23:00" },
    { day: "Tuesday", open: "14:00", close: "23:00" },
    { day: "Wednesday", open: "14:00", close: "23:00" },
    { day: "Thursday", open: "14:00", close: "23:00" },
    { day: "Friday", open: "14:00", close: "23:00" },
    { day: "Saturday", open: "14:00", close: "23:00" },
    { day: "Sunday", open: "14:00", close: "23:00" },
  ],
};

export const fallbackContact: ContactInfoData = {
  email: BUSINESS.email,
  phone: BUSINESS.phone,
  street: BUSINESS.address.street,
  area: BUSINESS.address.area,
  city: BUSINESS.address.city,
  postcode: BUSINESS.address.postcode,
  country: BUSINESS.address.country,
  locationNote:
    "Located on Rookery Road in the heart of Handsworth, NaijaGrill brings premium Nigerian dining to one of Birmingham's most vibrant neighbourhoods.",
  instagram: BUSINESS.social.instagram,
};

export const fallbackBlogCategories: BlogCategoryData[] = [
  {
    _id: "cat-1",
    title: "Nigerian Food",
    slug: "nigerian-food",
    description: "Recipes, ingredients, and the stories behind the plate.",
  },
  {
    _id: "cat-2",
    title: "Culture",
    slug: "culture",
    description: "Heritage, tradition, and the culture of Nigerian dining.",
  },
  {
    _id: "cat-3",
    title: "Events",
    slug: "events",
    description: "Supper clubs, celebrations, and happenings at NaijaGrill.",
  },
  {
    _id: "cat-4",
    title: "Local Guides",
    slug: "local-guides",
    description: "Handsworth, Birmingham, and where to eat beyond our doors.",
  },
];

export const fallbackBlogPosts: BlogPostData[] = [
  {
    _id: "post-1",
    title: "Why Party Jollof Belongs on a Premium Table",
    slug: "why-party-jollof-belongs-on-a-premium-table",
    author: "NaijaGrill Kitchen",
    excerpt:
      "Jollof is not a side dish. At NaijaGrill, it is the ceremony — smoke, spice, and the patience of the pot.",
    featuredImage:
      "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=1400&q=85",
    category: fallbackBlogCategories[0],
    publishedAt: "2026-01-15T10:00:00Z",
    body: [
      {
        _type: "block",
        _key: "intro",
        style: "normal",
        children: [
          {
            _type: "span",
            _key: "s1",
            text: "In Nigerian homes, jollof is never rushed. The base is built slowly — tomatoes reduced, peppers softened, spices bloomed in oil until the kitchen fills with scent. At NaijaGrill, we honour that rhythm.",
          },
        ],
        markDefs: [],
      },
      {
        _type: "block",
        _key: "h2",
        style: "h2",
        children: [
          {
            _type: "span",
            _key: "s2",
            text: "Smoke as an ingredient",
          },
        ],
        markDefs: [],
      },
      {
        _type: "block",
        _key: "body2",
        style: "normal",
        children: [
          {
            _type: "span",
            _key: "s3",
            text: "Wood-fire finishing gives our party jollof its signature depth — a char that sits at the edge of the pot, not on top of the rice. It is the difference between good jollof and jollof that stops conversation.",
          },
        ],
        markDefs: [],
      },
    ],
    faqs: [
      {
        question: "What makes NaijaGrill jollof different?",
        answer:
          "We build the base slowly, finish over wood fire, and serve jollof as the centrepiece of the table rather than an accompaniment.",
      },
      {
        question: "Is jollof suitable for sharing?",
        answer:
          "Absolutely. Our party jollof is designed for the long table — generous portions meant to be passed and enjoyed together.",
      },
    ],
    seo: {
      title: "Why Party Jollof Belongs on a Premium Table | NaijaGrill",
      description:
        "Discover how NaijaGrill elevates party jollof with slow technique, wood-fire finishing, and premium hospitality.",
    },
  },
  {
    _id: "post-2",
    title: "A Guide to Handsworth for the Curious Diner",
    slug: "guide-to-handsworth-for-curious-diner",
    author: "NaijaGrill",
    excerpt:
      "Handsworth is one of Birmingham's most culturally rich neighbourhoods — and the perfect setting for Nigerian cuisine done properly.",
    featuredImage:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=85",
    category: fallbackBlogCategories[3],
    publishedAt: "2026-02-01T10:00:00Z",
    body: [
      {
        _type: "block",
        _key: "intro2",
        style: "normal",
        children: [
          {
            _type: "span",
            _key: "s4",
            text: "Rookery Road sits at the heart of Handsworth — a neighbourhood shaped by migration, music, and food cultures from across the world. NaijaGrill is proud to call it home.",
          },
        ],
        markDefs: [],
      },
    ],
    faqs: [
      {
        question: "Where is NaijaGrill located?",
        answer:
          "We are at 77B Rookery Road, Handsworth, Birmingham B21 9QU.",
      },
    ],
    seo: {
      title: "A Guide to Handsworth for the Curious Diner | NaijaGrill",
      description:
        "Explore Handsworth, Birmingham — the neighbourhood NaijaGrill calls home on Rookery Road.",
    },
  },
];

export const fallbackEvents: EventData[] = [
  {
    _id: "event-1",
    title: "Supper Club: Fire & Spice",
    slug: "supper-club-fire-and-spice",
    excerpt:
      "A five-course evening exploring charcoal-grilled Nigerian dishes, paired with West African-inspired cocktails.",
    featuredImage:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=85",
    eventDate: "2026-07-12T19:00:00Z",
    location: "NaijaGrill, 77B Rookery Road, Handsworth",
  },
  {
    _id: "event-2",
    title: "Handsworth Heritage Lunch",
    slug: "handsworth-heritage-lunch",
    excerpt:
      "A relaxed Sunday lunch celebrating the neighbourhood's culinary history — family-style service, live music.",
    featuredImage:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=85",
    eventDate: "2026-08-03T12:30:00Z",
    location: "NaijaGrill, Handsworth, Birmingham",
  },
];

export const fallbackGalleryImages: GalleryImageData[] = [
  {
    _id: "gal-1",
    title: "Jollof service",
    image:
      "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=1400&q=85",
    alt: "Party jollof served at the table",
    caption: "Party jollof — the centrepiece of every service",
    order: 1,
  },
  {
    _id: "gal-2",
    title: "Charcoal grill",
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1400&q=85",
    alt: "Suya prepared over charcoal",
    caption: "Fire, refined",
    order: 2,
  },
  {
    _id: "gal-3",
    title: "The dining room",
    image:
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1400&q=85",
    alt: "Warm dining room interior",
    caption: "An evening measured in conversation",
    order: 3,
  },
];

export const fallbackExplorePage: ExplorePageData = {
  title: "Explore Nigerian Cuisine",
  subtitle:
    "A long-form guide to the flavours, traditions, and techniques behind Nigeria's most celebrated dishes.",
  heroImage:
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=2400&q=85",
  introduction: [
    {
      _type: "block",
      _key: "intro",
      style: "normal",
      children: [
        {
          _type: "span",
          _key: "s1",
          text: "Nigerian cuisine is one of the world's great food traditions — built on fire, fermentation, spice, and the generosity of shared plates. This guide is your starting point.",
        },
      ],
      markDefs: [],
    },
  ],
  sections: [
    {
      heading: "The foundations of flavour",
      body: [
        {
          _type: "block",
          _key: "s1",
          style: "normal",
          children: [
            {
              _type: "span",
              _key: "t1",
              text: "From scotch bonnet to uziza, from palm oil to fermented locust beans — Nigerian cooking is defined by ingredients with character. Understanding them is the first step to appreciating the cuisine.",
            },
          ],
          markDefs: [],
        },
      ],
      image:
        "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1400&q=85",
      imagePosition: "right",
    },
    {
      heading: "Fire and the grill",
      body: [
        {
          _type: "block",
          _key: "s2",
          style: "normal",
          children: [
            {
              _type: "span",
              _key: "t2",
              text: "Suya, asun, and grilled fish — Nigerian cuisine has always understood charcoal. At NaijaGrill, we bring that street-fire tradition into a premium dining context.",
            },
          ],
          markDefs: [],
        },
      ],
      image:
        "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=1400&q=85",
      imagePosition: "left",
    },
  ],
  faqs: [
    {
      question: "What is Nigerian cuisine?",
      answer:
        "Nigerian cuisine encompasses the diverse food traditions of Nigeria's many ethnic groups, unified by bold spices, shared plates, and techniques like slow stewing and charcoal grilling.",
    },
    {
      question: "Where can I try Nigerian food in Birmingham?",
      answer:
        "NaijaGrill at 77B Rookery Road, Handsworth, offers premium Nigerian dining in Birmingham.",
    },
  ],
  seo: {
    title: "Explore Nigerian Cuisine | NaijaGrill Birmingham",
    description:
      "A premium guide to Nigerian cuisine — flavours, traditions, and where to experience them in Handsworth, Birmingham.",
  },
};

export function getFallbackRelatedPosts(
  currentSlug: string,
): BlogPostPreview[] {
  return fallbackBlogPosts
    .filter((post) => post.slug !== currentSlug)
    .map((post) => ({
      _id: post._id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      featuredImage: post.featuredImage,
      author: post.author,
      publishedAt: post.publishedAt,
      category: post.category,
    }));
}
