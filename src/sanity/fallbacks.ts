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
  experienceImage: "/images/naija-grill-and-spice-room2.jpg",
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
    _id: "menu-amala-ewedu-gbegiri",
    title: "Amala, Ewedu & Gbegiri",
    description:
      "Smooth amala with ewedu and gbegiri, finished with rich pepper stew and assorted meat.",
    price: 13.99,
    section: "soups-swallows",
    image: "/images/menu/naijagrill-amala-ewedu-gbegiri.jpg",
    localImage: "/images/menu/naijagrill-amala-ewedu-gbegiri.jpg",
    badge: "Featured",
    orderable: true,
    uberEatsUrl: BUSINESS.order.uberEatsUrl,
    order: 7,
    seo: {
      title: "Amala, Ewedu & Gbegiri | NaijaGrill Birmingham",
      description:
        "Order amala with ewedu and gbegiri (abula) from NaijaGrill in Handsworth, Birmingham.",
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
    _id: "menu-grilled-fish",
    title: "Grilled Fish",
    description:
      "Whole grilled fish in pepper sauce with fried yam and sweet plantain.",
    price: 18.99,
    section: "seafood-pepper",
    image: "/images/menu/naijagrill-grilled-fish-yam-plantain.jpg",
    localImage: "/images/menu/naijagrill-grilled-fish-yam-plantain.jpg",
    orderable: true,
    uberEatsUrl: BUSINESS.order.uberEatsUrl,
    order: 9,
    seo: {
      title: "Grilled Fish | NaijaGrill Birmingham",
      description:
        "Order whole grilled fish with fried yam and plantain from NaijaGrill in Handsworth, Birmingham.",
    },
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
    title: "Ewa Agoyin with Plantain",
    description:
      "Beans mashed soft under a dark, slow-caramelised agoyin pepper sauce, with sweet fried plantain.",
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
    _id: "testimonial-google-1",
    quote:
      "Naija grill has great customer service and the food is so tasty. I can call the restaurant, home away from home.",
    author: "Olujobi Olasunkanmi",
    context: "Dine-in",
  },
  {
    _id: "testimonial-google-2",
    quote:
      "The best place to get real African / Nigerian food. Jolof rice, fried rice, beef suya, chicken suya, abula, seafood Okra, efo riro, egusi soup etc.",
    author: "Mustapha Abdul Rasheed",
    context: "Delivery",
  },
  {
    _id: "testimonial-google-3",
    quote:
      "I always order from this shop. Excellent service and mouth watering food. 10/10. Everything is always fresh whenever I order, let it be the lamb chops, donner, chips, salad or even the chicken tikka — everything is always fresh and delicious.",
    author: "Asha Begum",
    context: "Delivery",
  },
  {
    _id: "testimonial-google-4",
    quote:
      "I love the food here and the people who work here are very nice and I feel comfortable being there.",
    author: "Samad Oluwa",
    context: "Takeaway",
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
  phone: BUSINESS.phoneDisplay,
  landline: BUSINESS.landlineDisplay,
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
    _id: "post-nigerian-takeaway-birmingham",
    title: "Nigerian Takeaway in Birmingham: Top Dishes to Try",
    slug: "nigerian-takeaway-in-birmingham-top-dishes-to-try",
    author: "NaijaGrill Kitchen",
    excerpt:
      "Craving a Nigerian takeaway in Birmingham? These are the top dishes to order for delivery or collection from NaijaGrill in Handsworth — and how to get them.",
    featuredImage:
      "/images/menu/naijagrill-jollof-rice-plantain-assorted-meat.jpg",
    category: fallbackBlogCategories[3],
    publishedAt: "2026-06-13T09:00:00Z",
    body: [
      {
        _type: "block",
        _key: "ntw-i",
        style: "normal",
        markDefs: [{ _key: "ntw-l1", _type: "link", href: "/menu" }],
        children: [
          {
            _type: "span",
            _key: "ntw-i1",
            text: "Looking for a Nigerian takeaway in Birmingham? Whether you want delivery to your door or a quick collection in Handsworth, these are the dishes worth ordering first from our ",
          },
          { _type: "span", _key: "ntw-i2", marks: ["ntw-l1"], text: "Nigerian food menu" },
          { _type: "span", _key: "ntw-i3", text: "." },
        ],
      },
      {
        _type: "block",
        _key: "ntw-h1",
        style: "h2",
        markDefs: [],
        children: [{ _type: "span", _key: "ntw-h1s", text: "Party jollof rice" }],
      },
      {
        _type: "block",
        _key: "ntw-b1",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "ntw-b1s",
            text: "Smoky, tomato-rich jollof with plantain and your choice of protein. It travels beautifully, which makes it the number one Nigerian takeaway order in Birmingham.",
          },
        ],
      },
      {
        _type: "block",
        _key: "ntw-h2",
        style: "h2",
        markDefs: [],
        children: [{ _type: "span", _key: "ntw-h2s", text: "Beef and chicken suya" }],
      },
      {
        _type: "block",
        _key: "ntw-b2",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "ntw-b2s",
            text: "Charcoal-grilled, yaji-spiced suya is made for sharing. Add a portion for the table and it stays smoky and tender on the way home.",
          },
        ],
      },
      {
        _type: "block",
        _key: "ntw-h3",
        style: "h2",
        markDefs: [],
        children: [{ _type: "span", _key: "ntw-h3s", text: "Soups with swallow" }],
      },
      {
        _type: "block",
        _key: "ntw-b3",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "ntw-b3s",
            text: "Egusi, efo riro, and okro with poundo or amala are hearty, comforting, and pack well for delivery — a proper Nigerian meal without leaving home.",
          },
        ],
      },
      {
        _type: "block",
        _key: "ntw-h4",
        style: "h2",
        markDefs: [],
        children: [{ _type: "span", _key: "ntw-h4s", text: "Small chops for the table" }],
      },
      {
        _type: "block",
        _key: "ntw-b4",
        style: "normal",
        markDefs: [
          {
            _key: "ntw-l2",
            _type: "link",
            href: "https://www.ubereats.com/store-browse-uuid/ed5cf926-4f43-460d-960b-135912d864fb?diningMode=DELIVERY",
          },
        ],
        children: [
          {
            _type: "span",
            _key: "ntw-b4a",
            text: "Puff puff, samosas, and spring rolls are perfect add-ons. Ready to eat? ",
          },
          { _type: "span", _key: "ntw-b4b", marks: ["ntw-l2"], text: "Order NaijaGrill on Uber Eats" },
          { _type: "span", _key: "ntw-b4c", text: " for African takeaway across Birmingham." },
        ],
      },
    ],
    faqs: [
      {
        question: "Is there a good Nigerian takeaway in Birmingham?",
        answer:
          "Yes. NaijaGrill in Handsworth offers Nigerian takeaway and delivery across Birmingham via Uber Eats, including jollof rice, suya, soups with swallow, and small chops.",
      },
      {
        question: "Can I get Nigerian food delivered in Birmingham?",
        answer:
          "Yes, you can order NaijaGrill for delivery on Uber Eats, or collect a takeaway from 77B Rookery Road, Handsworth.",
      },
      {
        question: "What is the best Nigerian dish for takeaway?",
        answer:
          "Party jollof rice with plantain and protein is the most popular takeaway dish because it keeps its flavour well; suya and small chops are great for sharing.",
      },
    ],
    seo: {
      title: "Nigerian Takeaway in Birmingham: Top Dishes to Try | NaijaGrill",
      description:
        "The best Nigerian takeaway in Birmingham — order jollof, suya, egusi, and small chops from NaijaGrill in Handsworth for delivery or collection on Uber Eats.",
    },
  },
  {
    _id: "post-nigerian-catering-birmingham",
    title: "Catering for Nigerian Parties, Weddings and Events in Birmingham",
    slug: "catering-for-nigerian-parties-weddings-and-events-in-birmingham",
    author: "NaijaGrill Kitchen",
    excerpt:
      "Planning a celebration? NaijaGrill offers Nigerian catering in Birmingham for parties, weddings, naming ceremonies, and corporate events — generous party food done properly.",
    featuredImage: "/images/menu/naijagrill-assorted-spread.jpg",
    category: fallbackBlogCategories[2],
    publishedAt: "2026-06-12T09:00:00Z",
    body: [
      {
        _type: "block",
        _key: "nct-i",
        style: "normal",
        markDefs: [{ _key: "nct-l1", _type: "link", href: "/events-catering" }],
        children: [
          {
            _type: "span",
            _key: "nct-i1",
            text: "From intimate gatherings to big celebrations, NaijaGrill provides Nigerian catering in Birmingham that brings real flavour to your event. Explore our ",
          },
          { _type: "span", _key: "nct-i2", marks: ["nct-l1"], text: "events and catering services" },
          { _type: "span", _key: "nct-i3", text: " and tell us what you are planning." },
        ],
      },
      {
        _type: "block",
        _key: "nct-h1",
        style: "h2",
        markDefs: [],
        children: [{ _type: "span", _key: "nct-h1s", text: "Weddings and engagements" }],
      },
      {
        _type: "block",
        _key: "nct-b1",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "nct-b1s",
            text: "African wedding catering in Birmingham is one of our specialities — large trays of party jollof, fried rice, assorted meats, grilled fish, and sides, served the way guests expect at a Nigerian celebration.",
          },
        ],
      },
      {
        _type: "block",
        _key: "nct-h2",
        style: "h2",
        markDefs: [],
        children: [{ _type: "span", _key: "nct-h2s", text: "Naming ceremonies and parties" }],
      },
      {
        _type: "block",
        _key: "nct-b2",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "nct-b2s",
            text: "Naming ceremonies, birthdays, and family get-togethers call for generous Nigerian party food. We scale the menu to your guest count and keep the spice and portions authentic.",
          },
        ],
      },
      {
        _type: "block",
        _key: "nct-h3",
        style: "h2",
        markDefs: [],
        children: [{ _type: "span", _key: "nct-h3s", text: "Corporate and community events" }],
      },
      {
        _type: "block",
        _key: "nct-b3",
        style: "normal",
        markDefs: [{ _key: "nct-l2", _type: "link", href: "/menu" }],
        children: [
          {
            _type: "span",
            _key: "nct-b3a",
            text: "Corporate trays and church or community events are welcome too. Browse the ",
          },
          { _type: "span", _key: "nct-b3b", marks: ["nct-l2"], text: "menu" },
          {
            _type: "span",
            _key: "nct-b3c",
            text: " for ideas, then send us your date, guest numbers, and service style for a quote.",
          },
        ],
      },
    ],
    faqs: [
      {
        question: "Do you offer Nigerian catering in Birmingham?",
        answer:
          "Yes. NaijaGrill caters Nigerian food for parties, weddings, naming ceremonies, corporate events, and community gatherings across Birmingham and the West Midlands.",
      },
      {
        question: "Can you cater a Nigerian wedding in Birmingham?",
        answer:
          "Yes, African wedding catering is one of our specialities — party jollof, fried rice, assorted meats, grilled fish, and sides, scaled to your guest count.",
      },
      {
        question: "How do I get a catering quote?",
        answer:
          "Use the events and catering enquiry form on our website with your date, guest estimate, occasion, and whether you want restaurant hosting or catering at your venue.",
      },
    ],
    seo: {
      title: "Nigerian Catering Birmingham — Parties, Weddings & Events | NaijaGrill",
      description:
        "Nigerian catering in Birmingham for parties, weddings, naming ceremonies, and corporate events. Authentic party jollof, suya, and sides from NaijaGrill, Handsworth.",
    },
  },
  {
    _id: "post-what-to-order-first-time",
    title: "What to Order at a Nigerian Restaurant for the First Time",
    slug: "what-to-order-at-a-nigerian-restaurant-for-the-first-time",
    author: "NaijaGrill Kitchen",
    excerpt:
      "New to Nigerian food? Here are five dishes to order on your first visit — jollof rice, egusi soup, pounded yam, suya, and pepper soup — and what each one tastes like.",
    featuredImage: "/images/menu/naijagrill-jollof-rice-assorted-meat-egg.jpg",
    category: fallbackBlogCategories[0],
    publishedAt: "2026-06-11T09:00:00Z",
    body: [
      {
        _type: "block",
        _key: "wto-i",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "wto-i1",
            text: "Trying Nigerian food for the first time? It is bold, warming, and generous, and a little guidance goes a long way. Here are five dishes that make the perfect introduction.",
          },
        ],
      },
      {
        _type: "block",
        _key: "wto-h1",
        style: "h2",
        markDefs: [],
        children: [{ _type: "span", _key: "wto-h1s", text: "1. Jollof rice" }],
      },
      {
        _type: "block",
        _key: "wto-b1",
        style: "normal",
        markDefs: [
          { _key: "wto-l1", _type: "link", href: "/blog/what-is-jollof-rice-a-beginners-guide" },
        ],
        children: [
          {
            _type: "span",
            _key: "wto-b1a",
            text: "Smoky, tomato-rich party rice — the most loved dish in West Africa and the easiest place to start. New to it? Read our ",
          },
          { _type: "span", _key: "wto-b1b", marks: ["wto-l1"], text: "beginner's guide to jollof rice" },
          { _type: "span", _key: "wto-b1c", text: "." },
        ],
      },
      {
        _type: "block",
        _key: "wto-h2",
        style: "h2",
        markDefs: [],
        children: [{ _type: "span", _key: "wto-h2s", text: "2. Egusi soup" }],
      },
      {
        _type: "block",
        _key: "wto-b2",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "wto-b2s",
            text: "A thick, savoury melon-seed soup with greens, fish, and meat. Rich and comforting, and a great gateway to Nigerian soups.",
          },
        ],
      },
      {
        _type: "block",
        _key: "wto-h3",
        style: "h2",
        markDefs: [],
        children: [{ _type: "span", _key: "wto-h3s", text: "3. Pounded yam (and swallow)" }],
      },
      {
        _type: "block",
        _key: "wto-b3",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "wto-b3s",
            text: "Soft, stretchy pounded yam is the classic partner for egusi or efo riro. You tear a small piece, scoop the soup, and enjoy — no cutlery needed.",
          },
        ],
      },
      {
        _type: "block",
        _key: "wto-h4",
        style: "h2",
        markDefs: [],
        children: [{ _type: "span", _key: "wto-h4s", text: "4. Suya" }],
      },
      {
        _type: "block",
        _key: "wto-b4",
        style: "normal",
        markDefs: [
          { _key: "wto-l2", _type: "link", href: "/blog/what-is-suya-everything-you-need-to-know" },
        ],
        children: [
          {
            _type: "span",
            _key: "wto-b4a",
            text: "Spicy, charcoal-grilled skewers coated in nutty yaji spice. Smoky and a little fiery — learn more in our ",
          },
          { _type: "span", _key: "wto-b4b", marks: ["wto-l2"], text: "complete guide to suya" },
          { _type: "span", _key: "wto-b4c", text: "." },
        ],
      },
      {
        _type: "block",
        _key: "wto-h5",
        style: "h2",
        markDefs: [],
        children: [{ _type: "span", _key: "wto-h5s", text: "5. Pepper soup" }],
      },
      {
        _type: "block",
        _key: "wto-b5",
        style: "normal",
        markDefs: [{ _key: "wto-l3", _type: "link", href: "/menu" }],
        children: [
          {
            _type: "span",
            _key: "wto-b5a",
            text: "A light, aromatic, spiced broth with meat or fish — warming and full of flavour. Ready to taste them all? See the full ",
          },
          { _type: "span", _key: "wto-b5b", marks: ["wto-l3"], text: "NaijaGrill menu" },
          { _type: "span", _key: "wto-b5c", text: "." },
        ],
      },
    ],
    faqs: [
      {
        question: "What should I order at a Nigerian restaurant for the first time?",
        answer:
          "Start with jollof rice and suya, then try egusi soup with pounded yam and a bowl of pepper soup. These five dishes are the best introduction to Nigerian food.",
      },
      {
        question: "Is Nigerian food very spicy?",
        answer:
          "Some dishes carry warming heat, but it varies. Jollof rice and small chops are mild and beginner-friendly, and the team can guide you on spice levels.",
      },
      {
        question: "What is swallow in Nigerian food?",
        answer:
          "Swallow is a soft staple like pounded yam, poundo, or amala that you eat with soups such as egusi or efo riro, using your hands to scoop.",
      },
    ],
    seo: {
      title: "What to Order at a Nigerian Restaurant for the First Time | NaijaGrill",
      description:
        "New to Nigerian food? Order jollof rice, egusi soup, pounded yam, suya, and pepper soup on your first visit. A beginner's guide from NaijaGrill, Birmingham.",
    },
  },
  {
    _id: "post-best-nigerian-food-birmingham",
    title: "Best Nigerian Food To Try In Birmingham",
    slug: "best-nigerian-food-to-try-in-birmingham",
    author: "NaijaGrill Kitchen",
    excerpt:
      "From smoky party jollof to charcoal suya, pepper soup, and small chops, here are the Nigerian dishes worth crossing Birmingham for — and where to eat them in Handsworth.",
    featuredImage: "/images/menu/naijagrill-small-chops-platter.jpg",
    category: fallbackBlogCategories[3],
    publishedAt: "2026-06-10T09:00:00Z",
    body: [
      {
        _type: "block",
        _key: "bnf-intro",
        style: "normal",
        markDefs: [
          {
            _key: "bnf-l-restaurant",
            _type: "link",
            href: "/nigerian-restaurant-birmingham",
          },
        ],
        children: [
          {
            _type: "span",
            _key: "bnf-i1",
            text: "Birmingham is one of the best cities in the UK for Nigerian food, and Handsworth sits right at the heart of it. If you are new to the cuisine, this guide walks you through the dishes to order first at a ",
          },
          {
            _type: "span",
            _key: "bnf-i2",
            marks: ["bnf-l-restaurant"],
            text: "Nigerian restaurant in Birmingham",
          },
          {
            _type: "span",
            _key: "bnf-i3",
            text: " — what they taste like, how spicy they are, and why locals keep coming back.",
          },
        ],
      },
      {
        _type: "block",
        _key: "bnf-h1",
        style: "h2",
        markDefs: [],
        children: [
          { _type: "span", _key: "bnf-h1s", text: "Why Birmingham loves Nigerian food" },
        ],
      },
      {
        _type: "block",
        _key: "bnf-b1",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "bnf-b1s",
            text: "Birmingham has a large, proud West African community, and Nigerian cooking has become part of the city's everyday food culture. Expect bold spice, slow-cooked stews, charcoal-grilled meat, and generous plates designed to be shared. It is comfort food and celebration food at the same time.",
          },
        ],
      },
      {
        _type: "block",
        _key: "bnf-h2",
        style: "h2",
        markDefs: [],
        children: [{ _type: "span", _key: "bnf-h2s", text: "Party jollof rice" }],
      },
      {
        _type: "block",
        _key: "bnf-b2",
        style: "normal",
        markDefs: [
          {
            _key: "bnf-l-jollof",
            _type: "link",
            href: "/blog/what-is-jollof-rice-a-beginners-guide",
          },
        ],
        children: [
          {
            _type: "span",
            _key: "bnf-b2a",
            text: "If you only try one dish, make it jollof. Smoky, tomato-rich rice cooked party-style and served with plantain and your choice of protein, it is the centrepiece of every Nigerian table. New to it? Read our ",
          },
          {
            _type: "span",
            _key: "bnf-b2b",
            marks: ["bnf-l-jollof"],
            text: "beginner's guide to jollof rice",
          },
          { _type: "span", _key: "bnf-b2c", text: "." },
        ],
      },
      {
        _type: "block",
        _key: "bnf-h3",
        style: "h2",
        markDefs: [],
        children: [
          { _type: "span", _key: "bnf-h3s", text: "Suya from the charcoal grill" },
        ],
      },
      {
        _type: "block",
        _key: "bnf-b3",
        style: "normal",
        markDefs: [
          {
            _key: "bnf-l-suya",
            _type: "link",
            href: "/blog/what-is-suya-everything-you-need-to-know",
          },
        ],
        children: [
          {
            _type: "span",
            _key: "bnf-b3a",
            text: "Suya is thinly sliced beef or chicken coated in spicy yaji peanut spice and grilled over charcoal. Aromatic, smoky, and a little fiery, it is perfect with cold drinks. Learn more in our ",
          },
          {
            _type: "span",
            _key: "bnf-b3b",
            marks: ["bnf-l-suya"],
            text: "complete guide to suya",
          },
          { _type: "span", _key: "bnf-b3c", text: "." },
        ],
      },
      {
        _type: "block",
        _key: "bnf-h4",
        style: "h2",
        markDefs: [],
        children: [
          { _type: "span", _key: "bnf-h4s", text: "Pepper soup and soups with swallow" },
        ],
      },
      {
        _type: "block",
        _key: "bnf-b4",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "bnf-b4s",
            text: "For something warming, order assorted meat pepper soup, or a classic soup-and-swallow such as poundo with egusi or efo riro. These dishes are deeply savoury and pair soft swallow with rich, spiced stews — the heart of home-style Nigerian cooking.",
          },
        ],
      },
      {
        _type: "block",
        _key: "bnf-h5",
        style: "h2",
        markDefs: [],
        children: [
          { _type: "span", _key: "bnf-h5s", text: "Small chops for sharing" },
        ],
      },
      {
        _type: "block",
        _key: "bnf-b5",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "bnf-b5s",
            text: "Small chops — puff puff, peppered chicken, samosas, and spring rolls — are the Nigerian answer to sharing plates. They are ideal for a table of friends, a celebration, or an easy introduction to the flavours before your mains arrive.",
          },
        ],
      },
      {
        _type: "block",
        _key: "bnf-h6",
        style: "h2",
        markDefs: [],
        children: [
          { _type: "span", _key: "bnf-h6s", text: "Where to eat in Handsworth, Birmingham" },
        ],
      },
      {
        _type: "block",
        _key: "bnf-b6",
        style: "normal",
        markDefs: [
          { _key: "bnf-l-menu", _type: "link", href: "/menu" },
          { _key: "bnf-l-res", _type: "link", href: "/reservations" },
        ],
        children: [
          {
            _type: "span",
            _key: "bnf-b6a",
            text: "NaijaGrill on Rookery Road brings these dishes together in one premium dining room. Browse the full ",
          },
          {
            _type: "span",
            _key: "bnf-b6b",
            marks: ["bnf-l-menu"],
            text: "Nigerian food menu",
          },
          { _type: "span", _key: "bnf-b6c", text: ", then " },
          {
            _type: "span",
            _key: "bnf-b6d",
            marks: ["bnf-l-res"],
            text: "reserve a table",
          },
          {
            _type: "span",
            _key: "bnf-b6e",
            text: " to try them for yourself.",
          },
        ],
      },
    ],
    faqs: [
      {
        question: "What Nigerian food should I try first in Birmingham?",
        answer:
          "Start with party jollof rice and suya. Jollof is the iconic smoky tomato rice, and suya is spiced charcoal-grilled meat — both are approachable, flavour-packed introductions to Nigerian cuisine.",
      },
      {
        question: "Where can I eat Nigerian food in Birmingham?",
        answer:
          "NaijaGrill is a premium Nigerian restaurant at 77B Rookery Road, Handsworth, Birmingham B21 9QU, serving jollof, suya, pepper soup, soups with swallow, and small chops.",
      },
      {
        question: "Is Nigerian food very spicy?",
        answer:
          "Many dishes carry warming heat from peppers and spice blends, but the level varies by dish. Milder options like jollof rice and small chops are great for first-timers, and the team can guide you.",
      },
      {
        question: "Can I get Nigerian food delivered in Birmingham?",
        answer:
          "Yes. You can order NaijaGrill favourites for delivery on Uber Eats, or reserve a table to dine in at the restaurant in Handsworth.",
      },
    ],
    seo: {
      title: "Best Nigerian Food To Try In Birmingham | NaijaGrill",
      description:
        "A local guide to the best Nigerian food in Birmingham — jollof rice, suya, pepper soup, and small chops, plus where to eat in Handsworth.",
    },
  },
  {
    _id: "post-what-is-jollof-rice",
    title: "What Is Jollof Rice? A Beginner's Guide",
    slug: "what-is-jollof-rice-a-beginners-guide",
    author: "NaijaGrill Kitchen",
    excerpt:
      "Jollof rice is West Africa's most famous dish — smoky, tomato-rich, and built for celebration. Here is what it is, where it comes from, and why everyone loves it.",
    featuredImage:
      "/images/menu/naijagrill-jollof-rice-plantain-assorted-meat.jpg",
    category: fallbackBlogCategories[0],
    publishedAt: "2026-06-05T09:00:00Z",
    body: [
      {
        _type: "block",
        _key: "jlf-intro",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "jlf-i1",
            text: "Jollof rice is the most famous dish in West African cooking — and for good reason. It is smoky, savoury, gently spiced, and made to be shared. If you have never tried it, this beginner's guide explains exactly what jollof is and why it sits at the centre of every celebration.",
          },
        ],
      },
      {
        _type: "block",
        _key: "jlf-h1",
        style: "h2",
        markDefs: [],
        children: [{ _type: "span", _key: "jlf-h1s", text: "What is jollof rice?" }],
      },
      {
        _type: "block",
        _key: "jlf-b1",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "jlf-b1s",
            text: "Jollof is long-grain rice cooked in a rich base of blended tomatoes, peppers, onions, and spices until every grain takes on colour and flavour. The best versions are finished over fire so the rice picks up a signature smoky depth. It is usually served with plantain and a protein such as chicken, beef, or fish.",
          },
        ],
      },
      {
        _type: "block",
        _key: "jlf-h2",
        style: "h2",
        markDefs: [],
        children: [
          { _type: "span", _key: "jlf-h2s", text: "A short history of jollof" },
        ],
      },
      {
        _type: "block",
        _key: "jlf-b2",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "jlf-b2s",
            text: "Jollof traces back to the Senegambia region of West Africa and has since become a beloved staple across Nigeria, Ghana, and beyond. The friendly rivalry over whose jollof is best — the famous 'jollof wars' — is part of the fun, but every version shares the same soul: a deeply flavoured tomato-pepper rice.",
          },
        ],
      },
      {
        _type: "block",
        _key: "jlf-h3",
        style: "h2",
        markDefs: [],
        children: [{ _type: "span", _key: "jlf-h3s", text: "Key jollof ingredients" }],
      },
      {
        _type: "block",
        _key: "jlf-b3",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "jlf-b3s",
            text: "The base is built from ripe tomatoes, red bell peppers, scotch bonnet, onions, and a blend of spices. Stock, bay leaves, and a little patience do the rest. The result is aromatic, slightly spicy rice with a colour that comes entirely from the slow-reduced sauce.",
          },
        ],
      },
      {
        _type: "block",
        _key: "jlf-h4",
        style: "h2",
        markDefs: [],
        children: [{ _type: "span", _key: "jlf-h4s", text: "Why people love jollof" }],
      },
      {
        _type: "block",
        _key: "jlf-b4",
        style: "normal",
        markDefs: [
          {
            _key: "jlf-l-best",
            _type: "link",
            href: "/blog/best-nigerian-food-to-try-in-birmingham",
          },
        ],
        children: [
          {
            _type: "span",
            _key: "jlf-b4a",
            text: "Jollof is comforting yet exciting, familiar yet endlessly variable. It works for a quiet dinner or a room full of guests, which is why it tops our list of the ",
          },
          {
            _type: "span",
            _key: "jlf-b4b",
            marks: ["jlf-l-best"],
            text: "best Nigerian food to try in Birmingham",
          },
          { _type: "span", _key: "jlf-b4c", text: "." },
        ],
      },
      {
        _type: "block",
        _key: "jlf-h5",
        style: "h2",
        markDefs: [],
        children: [
          { _type: "span", _key: "jlf-h5s", text: "How we cook jollof at NaijaGrill" },
        ],
      },
      {
        _type: "block",
        _key: "jlf-b5",
        style: "normal",
        markDefs: [
          { _key: "jlf-l-menu", _type: "link", href: "/menu" },
          { _key: "jlf-l-res", _type: "link", href: "/reservations" },
        ],
        children: [
          {
            _type: "span",
            _key: "jlf-b5a",
            text: "We build our base slowly and finish over wood fire for that unmistakable smoke. See it on our ",
          },
          {
            _type: "span",
            _key: "jlf-b5b",
            marks: ["jlf-l-menu"],
            text: "menu",
          },
          { _type: "span", _key: "jlf-b5c", text: ", or " },
          {
            _type: "span",
            _key: "jlf-b5d",
            marks: ["jlf-l-res"],
            text: "reserve a table",
          },
          {
            _type: "span",
            _key: "jlf-b5e",
            text: " in Handsworth to taste party jollof done properly.",
          },
        ],
      },
    ],
    faqs: [
      {
        question: "Is jollof rice spicy?",
        answer:
          "Jollof has a gentle, warming heat rather than a fierce one. The scotch bonnet adds depth and aroma more than fire, making it a great first Nigerian dish for most palates.",
      },
      {
        question: "What is the difference between jollof rice and fried rice?",
        answer:
          "Jollof is cooked in a tomato-and-pepper base that flavours and colours the rice, while Nigerian fried rice is stir-fried with vegetables and spices and has a lighter, savoury profile.",
      },
      {
        question: "Is jollof rice vegetarian?",
        answer:
          "The rice base itself can be vegetarian, though it is often cooked with meat stock and served with a protein. Ask the team about vegetarian options when you order.",
      },
      {
        question: "Where can I order jollof rice in Birmingham?",
        answer:
          "You can order jollof from NaijaGrill in Handsworth for dine-in by reserving a table, or for delivery on Uber Eats.",
      },
    ],
    seo: {
      title: "What Is Jollof Rice? A Beginner's Guide | NaijaGrill",
      description:
        "What is jollof rice? Learn the history, ingredients, and why this smoky West African tomato rice is loved worldwide — and where to try it in Birmingham.",
    },
  },
  {
    _id: "post-what-is-suya",
    title: "What Is Suya? Everything You Need To Know",
    slug: "what-is-suya-everything-you-need-to-know",
    author: "NaijaGrill Kitchen",
    excerpt:
      "Suya is Nigeria's iconic spiced, charcoal-grilled meat. Here is where it comes from, how it is made, what yaji spice is, and why it is so addictive.",
    featuredImage:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1400&q=85",
    category: fallbackBlogCategories[0],
    publishedAt: "2026-05-28T09:00:00Z",
    body: [
      {
        _type: "block",
        _key: "suy-intro",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "suy-i1",
            text: "Suya is one of Nigeria's most loved street foods: thin slices of meat coated in a spicy peanut blend and grilled over charcoal. Smoky, nutty, and gently fiery, it is the kind of dish people crave again the moment they finish it. Here is everything you need to know.",
          },
        ],
      },
      {
        _type: "block",
        _key: "suy-h1",
        style: "h2",
        markDefs: [],
        children: [{ _type: "span", _key: "suy-h1s", text: "What is suya?" }],
      },
      {
        _type: "block",
        _key: "suy-b1",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "suy-b1s",
            text: "Suya is spiced, skewered meat — usually beef, but also chicken — grilled over open charcoal. What makes it special is the yaji: a dry rub of ground peanuts, chilli, ginger, and spices that crusts the meat as it cooks. It is typically served with sliced onions, tomatoes, and extra spice on the side.",
          },
        ],
      },
      {
        _type: "block",
        _key: "suy-h2",
        style: "h2",
        markDefs: [],
        children: [{ _type: "span", _key: "suy-h2s", text: "The origins of suya" }],
      },
      {
        _type: "block",
        _key: "suy-b2",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "suy-b2s",
            text: "Suya originates with the Hausa people of northern Nigeria and has spread across the country and West Africa as a beloved evening street food. Today you will find suya grills firing up after dark, the air thick with charcoal smoke and the scent of yaji.",
          },
        ],
      },
      {
        _type: "block",
        _key: "suy-h3",
        style: "h2",
        markDefs: [],
        children: [{ _type: "span", _key: "suy-h3s", text: "How suya is made" }],
      },
      {
        _type: "block",
        _key: "suy-b3",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "suy-b3s",
            text: "The meat is sliced thin, threaded onto skewers, and coated generously in yaji. It is then grilled close to glowing charcoal so the spice toasts and the edges char. A final dusting of spice just before serving keeps the flavour sharp and aromatic.",
          },
        ],
      },
      {
        _type: "block",
        _key: "suy-h4",
        style: "h2",
        markDefs: [],
        children: [
          { _type: "span", _key: "suy-h4s", text: "Yaji — the suya spice blend" },
        ],
      },
      {
        _type: "block",
        _key: "suy-b4",
        style: "normal",
        markDefs: [],
        children: [
          {
            _type: "span",
            _key: "suy-b4s",
            text: "Yaji (also called suya spice) is the soul of the dish. It blends roasted, ground peanuts with cayenne, ginger, garlic, and other spices. The peanuts add savoury richness, while the chilli brings the heat that suya is famous for.",
          },
        ],
      },
      {
        _type: "block",
        _key: "suy-h5",
        style: "h2",
        markDefs: [],
        children: [{ _type: "span", _key: "suy-h5s", text: "Why suya is so popular" }],
      },
      {
        _type: "block",
        _key: "suy-b5",
        style: "normal",
        markDefs: [
          {
            _key: "suy-l-jollof",
            _type: "link",
            href: "/blog/what-is-jollof-rice-a-beginners-guide",
          },
          { _key: "suy-l-menu", _type: "link", href: "/menu" },
        ],
        children: [
          {
            _type: "span",
            _key: "suy-b5a",
            text: "Suya hits every note: smoke, spice, crunch, and protein. It is perfect for sharing and pairs beautifully with jollof rice — see our ",
          },
          {
            _type: "span",
            _key: "suy-b5b",
            marks: ["suy-l-jollof"],
            text: "guide to jollof rice",
          },
          { _type: "span", _key: "suy-b5c", text: ". Find suya and more on our " },
          {
            _type: "span",
            _key: "suy-b5d",
            marks: ["suy-l-menu"],
            text: "menu",
          },
          {
            _type: "span",
            _key: "suy-b5e",
            text: ", available to dine in or order on Uber Eats.",
          },
        ],
      },
    ],
    faqs: [
      {
        question: "What meat is suya made from?",
        answer:
          "Suya is most often made with beef, but chicken suya is also popular. The meat is sliced thin, coated in yaji spice, and grilled over charcoal.",
      },
      {
        question: "Is suya spicy?",
        answer:
          "Yes, suya has a noticeable kick from the chilli in the yaji spice, balanced by the savoury, nutty peanut base. You can usually ask for more or less spice.",
      },
      {
        question: "What is the difference between suya and a kebab?",
        answer:
          "While both are skewered grilled meats, suya is defined by yaji — a peanut-and-chilli spice blend — and its charcoal smoke, giving it a distinctly nutty, spicy West African character.",
      },
      {
        question: "Can I order suya for delivery in Birmingham?",
        answer:
          "Yes. You can order suya and other NaijaGrill favourites on Uber Eats, or reserve a table to enjoy it fresh off the grill in Handsworth.",
      },
    ],
    seo: {
      title: "What Is Suya? Everything You Need To Know | NaijaGrill",
      description:
        "What is suya? Discover the origins, preparation, and yaji spice behind Nigeria's iconic charcoal-grilled meat — and where to order it in Birmingham.",
    },
  },
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
    image: "/images/menu/jollof-rice.jpeg",
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
    image: "/images/naija-grill-and-spice-room2.jpg",
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
