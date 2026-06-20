/**
 * Seed script: creates the 6 NaijaGrill blog posts in Sanity.
 *
 * Requirements:
 *   SANITY_API_WRITE_TOKEN  — a Sanity API token with Editor or higher access
 *   (create at sanity.io/manage → project → API → Tokens)
 *
 * Run:
 *   SANITY_API_WRITE_TOKEN=sk... node scripts/seed-blog-posts.mjs
 */

import { createClient } from "@sanity/client";

const PROJECT_ID = "26qme93a";
const DATASET = "production";
const API_VERSION = "2024-01-01";

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("Missing SANITY_API_WRITE_TOKEN env var.");
  process.exit(1);
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  token,
  useCdn: false,
});

function block(text) {
  return {
    _type: "block",
    _key: Math.random().toString(36).slice(2),
    style: "normal",
    children: [{ _type: "span", _key: Math.random().toString(36).slice(2), text, marks: [] }],
    markDefs: [],
  };
}

function h2(text) {
  return {
    _type: "block",
    _key: Math.random().toString(36).slice(2),
    style: "h2",
    children: [{ _type: "span", _key: Math.random().toString(36).slice(2), text, marks: [] }],
    markDefs: [],
  };
}

const posts = [
  // PROMPT 2 — Halal / Dietary Requirements
  {
    _type: "blogPost",
    _id: "blog-nigerian-food-dietary-requirements-birmingham",
    title: "Is Nigerian Food Halal? What Muslim Diners Should Know Before Visiting a Nigerian Restaurant in Birmingham",
    slug: { _type: "slug", current: "nigerian-food-dietary-requirements-birmingham" },
    author: "NaijaGrill Kitchen",
    excerpt: "A practical guide for Muslim diners in Birmingham — what Nigerian food typically contains, what to ask when you call, and how to approach a Nigerian restaurant if dietary requirements matter to you.",
    publishedAt: "2025-06-01T12:00:00Z",
    body: [
      block("Nigerian food has deep roots in West African cooking, and for the most part, traditional Nigerian recipes contain no pork and no alcohol. The base of most dishes — palm oil, onion, crayfish, scotch bonnet pepper, and a selection of spices and aromatics — is naturally free from ingredients that conflict with Islamic dietary law. The proteins that appear most often are beef, chicken, goat, and fish. On the surface, this makes Nigerian food a strong candidate for Muslim diners."),
      block("But there's more to it than the ingredient list. The real question isn't what Nigerian food contains in principle — it's how the restaurant sources and prepares it. Halal meat must be slaughtered in a specific way, and not every Nigerian restaurant will use a certified halal butcher, even if pork never appears on the menu. Some kitchens share a grill or cooking surface across different proteins. Cross-contamination is worth asking about if your household is strict."),
      block("Birmingham's Muslim community is large and deeply embedded across the city — from Handsworth to Small Heath, Sparkhill to Lozells — and that shapes how restaurants here think about dietary requirements. A restaurant on Rookery Road is cooking for neighbours, and those neighbours include families for whom these questions matter practically, not just in theory."),
      h2("What to ask before you visit or order"),
      block("Ask directly whether the meat is sourced from a halal butcher. Ask whether pork is ever used in the kitchen — not just on the menu, but in stocks, marinades, or cooking oils. Ask whether the kitchen uses alcohol in any of its cooking, including stews or marinades. Ask about cross-contamination if this is important for your household."),
      block("These are reasonable questions and any restaurant worth visiting should be able to answer them clearly. If the answers are vague, or if the kitchen can't tell you where the meat comes from, you have your answer."),
      block("It's also worth knowing that Nigerian food tends to be robust and heavily seasoned — scotch bonnet pepper, crayfish, stockfish — and the flavours are built over long cooking times. The question of whether it's halal is separate from whether it's good, and Nigerian cooking is genuinely excellent food."),
      h2("At NaijaGrill"),
      block("At Naija Grill & Spice Kitchen on Rookery Road in Handsworth, we take dietary enquiries seriously and we're happy to talk through what's on the menu before you visit or order. We don't hold a formal halal certification at this time, but we cook without pork and without alcohol in our food, and we're transparent about how we source and prepare what we serve. Call or WhatsApp us on 07438 757560 — we'll give you a straight answer."),
      block("The Jollof Rice, Beef Suya, Grilled Fish, and Amala with Ewedu & Gbegiri are some of the dishes that bring people to the table here. If you've been curious but uncertain about Nigerian food in Birmingham, a conversation is the best place to start. Come in and see us, or find us on Uber Eats for delivery to your door."),
    ],
    seo: {
      _type: "seoMetadata",
      title: "Is Nigerian Food Halal? Muslim Diners' Guide — Birmingham | NaijaGrill",
      description: "A guide for Muslim diners: what Nigerian food typically contains, what to ask a Nigerian restaurant in Birmingham about halal sourcing, and how NaijaGrill handles dietary enquiries.",
    },
  },

  // PROMPT 3 — What Is Egusi Soup?
  {
    _type: "blogPost",
    _id: "blog-what-is-egusi-soup",
    title: "What Is Egusi Soup?",
    slug: { _type: "slug", current: "what-is-egusi-soup" },
    author: "NaijaGrill Kitchen",
    excerpt: "Egusi soup is one of the most eaten dishes in Nigeria — made from ground melon seeds, palm oil, leafy greens, and protein. Here's what it is, where it comes from, and how it tastes.",
    publishedAt: "2025-06-08T12:00:00Z",
    body: [
      block("Egusi soup is made from the seeds of a gourd plant — related to watermelon, but cultivated for the seeds rather than the fruit. The seeds are dried, shelled, and ground into a pale, oily flour. When that flour hits hot palm oil in a pot, it begins to toast and clump, forming small pellets of concentrated flavour that then absorb the liquid around them and build into the thick, nutty stew that Nigerians call egusi."),
      block("It is one of the most widely eaten soups in Nigeria. Both Yoruba and Igbo cooking claim it as a staple, though the preparation differs between households, between regions, and between cooks who have strong opinions about the right way to do it. Some fry the egusi in the oil first. Some mix it with water first. Some add tomatoes to the base; others keep it cleaner. These are arguments that Nigerian families have been having for decades and are unlikely to be resolved."),
      h2("What goes into egusi soup"),
      block("The base is palm oil — the red, dense, flavourful oil pressed from palm fruit that gives Nigerian soups their colour and their depth. Into that oil goes a blend of blended tomatoes, scotch bonnet peppers, and onions, cooked down until the rawness is completely gone. The egusi flour goes in next, toasting in the oil before liquid — stock, water, or a combination — is added to loosen the mixture."),
      block("Leafy greens come in toward the end: bitter leaf (efinrin) adds an aromatic, slightly bitter note; ugwu (pumpkin leaves) is milder and softer. Stockfish — dried, cured cod that rehydrates in the pot and contributes an intense, savoury depth — is essential in most versions. Proteins vary: beef, goat, chicken, dried fish, or combinations of all of them. The soup finishes rich, thick, and fragrant — the smell when it's cooking is one of those cooking smells that travels through walls."),
      h2("What egusi tastes like"),
      block("The flavour is nutty, savoury, and slightly bitter from the greens, with heat from the scotch bonnet that builds as you eat. The texture is thick — thicker than a European soup, closer to a stew — and it coats whatever it comes into contact with. There is nothing subtle about egusi. It is a deeply flavoured, fully committed soup that doesn't leave room for doubt."),
      h2("What you eat it with — and why"),
      block("Egusi is not a soup you serve with rice. It goes with swallow: the collective term for the starchy, stretchy accompaniments that Nigerian soups are built around. Pounded yam is the classic pairing — made from cooked yam that is pounded in a mortar until completely smooth and elastic. Poundo is the processed version: milder, consistent in texture, slightly lighter. Eba is made from gari (cassava flour), stickier and more textured. Amala is made from dried yam flour, darker and earthier."),
      block("You eat swallow by pulling a small piece with your hand or a spoon, shaping it slightly, and pressing it into the soup to coat it before eating. The swallow carries the egusi to your mouth. It's a different eating motion from a fork-and-plate setup, and the meal is more filling, more grounding — it sits in your body differently from a plate of rice."),
      h2("Egusi at NaijaGrill"),
      block("At NaijaGrill on Rookery Road in Handsworth, egusi is served two ways: Egusi & Pounded Yam (traditional pounded yam, smooth and stretchy) and Poundo with Egusi. The soup is made with greens, stockfish, and tender meat. It's a proper version of a dish that rewards the time it takes to make well. Order on Uber Eats for delivery, or come in and eat it at the table — reserve at naijagrillandspice.co.uk/reservations."),
    ],
    seo: {
      _type: "seoMetadata",
      title: "What Is Egusi Soup? Nigerian Egusi Guide | NaijaGrill Birmingham",
      description: "Egusi soup explained — ground melon seeds, palm oil, swallow, and why it's one of Nigeria's great dishes. Order from NaijaGrill in Handsworth, Birmingham.",
    },
  },

  // PROMPT 4 — What Is Amala?
  {
    _type: "blogPost",
    _id: "blog-what-is-amala",
    title: "What Is Amala? A Guide to One of Yoruba Cooking's Great Staples",
    slug: { _type: "slug", current: "what-is-amala" },
    author: "NaijaGrill Kitchen",
    excerpt: "Amala is a Yoruba swallow made from dried yam flour — dark, earthy, and satisfying. Here's what it is, how it's made, and why it's best eaten with ewedu and gbegiri as Abula.",
    publishedAt: "2025-06-15T12:00:00Z",
    body: [
      block("Amala is dark. That's the first thing people notice. It arrives as a smooth, dark brownish-black mound — made from yam that has been dried, peeled, and ground into flour, then mixed with boiling water until it forms a dense, elastic swallow. The colour comes from the drying process and the natural pigmentation of the yam skin, and it's one of the things that makes amala immediately distinct from other swallow dishes."),
      block("It originates in Yoruba culture, where it has been a staple for generations. The Yoruba are the dominant ethnic group in Lagos, Ogun, Osun, Oyo, Kwara, and Ekiti states in Nigeria, and amala is woven into the food culture of those areas in a way that goes beyond just eating. It's the kind of food that appears at every gathering — naming ceremonies, weddings, family dinners, late-night suppers. It's comfort food, but it's also the meal you make when you want to do things properly."),
      h2("How amala is made"),
      block("Yam is harvested, peeled, sliced, and dried in the sun until the moisture is gone and the slices are hard and stiff. The dried yam is then milled into a fine flour — sometimes at a local mill, sometimes commercially packaged as amala flour. To make amala, the flour is stirred into boiling water over heat, worked vigorously with a wooden spoon until it forms a smooth, cohesive mass with no lumps. It takes effort and attention — the texture depends on the ratio of flour to water and how long it's worked."),
      block("The result is smooth, slightly glossy, dense. It has a mild earthiness and a subtle bitterness that is completely its own. It doesn't taste neutral — it has a character that either resonates immediately or takes a few bites to appreciate. For people who grew up eating it, the flavour is as familiar and as comforting as anything in food. For first-timers, it's an education."),
      h2("Ewedu, gbegiri, and Abula"),
      block("Amala is rarely eaten alone. The classic pairing is ewedu — a soup made from jute leaves (also called mallow leaves or draw leaf), blended until silky and viscous. Ewedu is light and slightly mucilaginous — it has a draw to it that coats the amala and carries it. It is mild on its own; its job is structural, not bold."),
      block("Gbegiri completes the combination. It's made from cooked beans — usually black-eyed peas — blended smooth and seasoned. It's mild, creamy, slightly sweet, and a counterpoint to the bitterness of the amala and the earthy draw of the ewedu. Together — amala, ewedu, gbegiri, pepper stew, and assorted meat poured over — this combination is called Abula. It's one of the defining meals of Yoruba cooking."),
      block("The flavours are deep and savoury and the meal is filling in a way that sits differently from rice — more grounding, more settling. You eat it slowly. There's no rushing Abula."),
      h2("Amala in Birmingham"),
      block("Naija Grill & Spice Kitchen serves Amala, Ewedu & Gbegiri from the kitchen on Rookery Road in Handsworth, Birmingham. Open daily from 2pm to 11pm. Order on Uber Eats for delivery, or reserve a table at naijagrillandspice.co.uk/reservations."),
    ],
    seo: {
      _type: "seoMetadata",
      title: "What Is Amala? Yoruba Swallow Guide | NaijaGrill Birmingham",
      description: "Amala explained — the dark Yoruba swallow made from dried yam flour, and why it pairs perfectly with ewedu and gbegiri as Abula. Served at NaijaGrill, Handsworth.",
    },
  },

  // PROMPT 5 — What Is Pepper Soup?
  {
    _type: "blogPost",
    _id: "blog-what-is-nigerian-pepper-soup",
    title: "What Is Nigerian Pepper Soup?",
    slug: { _type: "slug", current: "what-is-nigerian-pepper-soup" },
    author: "NaijaGrill Kitchen",
    excerpt: "Pepper soup is a light, clear Nigerian broth with a distinctive spice blend and intense heat that builds as you eat. Here's what it is, what goes in it, and when Nigerians eat it.",
    publishedAt: "2025-06-22T12:00:00Z",
    body: [
      block("Pepper soup does not look like much. It arrives as a clear, brown broth — thin and translucent, not the thick richness of egusi or the dense body of a stew. What it lacks in opacity it makes up for in everything else. The smell hits first: a distinctive, almost medicinal warmth from the pepper soup spice blend — a combination of aromatic seeds and bark that varies by household and region but almost always includes uziza seed (a relative of black pepper), ehuru (African nutmeg), uda (negro pepper), and crayfish as the base. No other Nigerian soup smells like it."),
      block("The broth is cooked over long, slow heat — the protein (goat, catfish, offal, tilapia, or oxtail, depending on the version) simmering in stock with the spices, scotch bonnet peppers, and seasoning until everything has given what it has to give. The result is light in body but concentrated in flavour. The spice blend does a lot of the work — it's not just hot, it's complex. Warm, slightly bitter, faintly herbal. The heat from the scotch bonnet is there, but it's different from the direct chilli heat of a stew. It builds slowly, from the back of the throat, and it stays."),
      h2("When Nigerians eat pepper soup"),
      block("Pepper soup has an occasion. It's rainy season food — the kind of thing you want when it's cold and wet outside and you need something that gets into you. It's also the soup that appears after childbirth: warming and believed to aid recovery. At parties and owambes, it comes out as a starter, often in a small bowl to open the appetite before the main plates. Late at night, at a bar or a food spot, a bowl of pepper soup with cold beer is one of the most consistently excellent things you can eat in Nigeria."),
      block("The protein changes the dish considerably. Goat pepper soup has a depth and richness that comes from the bone. Catfish pepper soup (point and kill, as it's called in Lagos — ordered live from the tank) is lighter, with a clean sweetness from the fish against the heat of the broth. Offal pepper soup — intestine, tripe, liver — is for those who want the most intensely flavoured version, the one that the spices cling to hardest."),
      h2("How it feels to eat it"),
      block("There is a particular physical experience to pepper soup that is different from eating other hot food. The heat from the scotch bonnet and the warmth from the aromatic spices combine to produce a spreading sensation — warmth moving through your chest, into your face, your forehead. You sweat. This is the point. It's not unpleasant. It's the kind of warmth that feels earned."),
      block("At NaijaGrill on Rookery Road in Handsworth, pepper soup is on the menu with goat, catfish, and offal. Open from 2pm daily. Order on Uber Eats, or come in and have it at the table — the kind of soup that deserves to be eaten hot, as soon as it arrives."),
    ],
    seo: {
      _type: "seoMetadata",
      title: "What Is Nigerian Pepper Soup? | NaijaGrill Birmingham",
      description: "Pepper soup explained — the clear, aromatic Nigerian broth with a spice blend unlike anything else. Goat, catfish, and offal versions at NaijaGrill, Handsworth, Birmingham.",
    },
  },

  // PROMPT 6 — What Are Small Chops?
  {
    _type: "blogPost",
    _id: "blog-what-are-small-chops",
    title: "What Are Small Chops? The Nigerian Party Finger Food Explained",
    slug: { _type: "slug", current: "what-are-small-chops" },
    author: "NaijaGrill Kitchen",
    excerpt: "Small chops are the Nigerian party starter — puff puff, samosas, spring rolls, chicken, and more. Here's what they are, why they matter, and how NaijaGrill serves them.",
    publishedAt: "2025-06-29T12:00:00Z",
    body: [
      block("At a Nigerian party, the small chops arrive before you've sat down properly. They come around on trays carried by serving staff, or they're set out on a buffet table near the entrance so guests can eat while they find their seats. Puff puff, samosas, spring rolls, meat pies, chicken gizzard, peppered snails, prawn crackers — the exact composition varies by caterer and occasion, but the principle is always the same: finger food, bite-sized, eaten standing, passed and shared, setting the tone for what's coming."),
      block("Small chops are not a starter in the European sense. They're not a prelude to a multi-course meal with a formal pause before the next plate. They exist in their own social space — the part of a Nigerian gathering that happens while people are still arriving, while music is being tested, while aunties are greeting each other across the room. You eat small chops and you talk. The food is secondary to the occasion, which makes it exactly right for that moment."),
      h2("What makes a good small chops spread"),
      block("Puff puff is the anchor. These are small, fried dough balls — made from a yeasted batter that puffs up in the oil, golden on the outside with a soft, slightly chewy centre. They can be plain, lightly sweet, or flavoured with pepper. Good puff puff is light and not greasy. Bad puff puff is dense, oily, and cold. The difference matters and people notice."),
      block("Samosas and spring rolls come next — both fried, both crispy, both carrying some variation of spiced meat, vegetables, or a combination. A meat pie is a pastry shell with a filling of minced meat and potato in seasoned gravy, baked rather than fried — softer, more filling, better cold than you'd expect. Chicken and gizzard pieces, peppered and grilled, add something more substantial. A good spread has range: some things light, some things crispy, some things with heat, some without."),
      block("The quantity matters as much as the variety. Small chops at a party are not rationed. You should be able to go back twice, or three times, without feeling like you're taking someone else's share."),
      h2("Small chops at a restaurant"),
      block("Ordering small chops at a restaurant table is slightly different from the party context — you're sitting down, you have time, the tray isn't moving. But the pleasure is the same. They work as a starter, or as something to share while the main plates are being put together. They're also the right call for a table that can't agree on one starter — with small chops, everyone gets something."),
      block("At NaijaGrill, the Small Chops Platter covers puff puff, chicken, samosas, and spring rolls. Puff Puff is also available on its own. Order on Uber Eats for delivery, or ask about catering small chops for your next event — weddings, birthdays, naming ceremonies, community gatherings. Call or WhatsApp on 07438 757560."),
    ],
    seo: {
      _type: "seoMetadata",
      title: "What Are Small Chops? Nigerian Party Food Explained | NaijaGrill Birmingham",
      description: "Small chops explained — puff puff, samosas, spring rolls, and Nigerian party finger food. Order the Small Chops Platter from NaijaGrill in Handsworth, Birmingham.",
    },
  },

  // PROMPT 7 — Nigerian Food for Beginners
  {
    _type: "blogPost",
    _id: "blog-nigerian-food-beginners-guide",
    title: "Nigerian Food for Beginners: What to Order at a Nigerian Restaurant",
    slug: { _type: "slug", current: "nigerian-food-beginners-guide" },
    author: "NaijaGrill Kitchen",
    excerpt: "Never eaten Nigerian food? Here's where to start — five dishes to try, what to expect, how the eating works, and why a first visit to NaijaGrill in Birmingham is lower-risk than you think.",
    publishedAt: "2025-07-06T12:00:00Z",
    body: [
      block("Nigerian food is one of the most satisfying cuisines in the world and one of the least understood outside of West African communities. The cuisine is built on slow-cooked soups and stews, charcoal-grilled meat, deeply seasoned rice, and a whole category of dishes — soups eaten with stretchy, starchy swallows — that have no equivalent anywhere else. Getting into it is one of the better eating decisions you can make in Birmingham."),
      block("Here's how to start."),
      h2("Jollof Rice"),
      block("Jollof rice is the entry point. It's rice cooked in a tomato and pepper base — onion, scotch bonnet, tomato paste, stock — until all the liquid is absorbed and the grains have taken on the colour and flavour of everything they cooked in. It comes out orange-red, glossy, and fragrant. The version known as Party Jollof is cooked in a large pot over open flame, which gives the bottom layer a smoky crust that gets folded through the rest of the rice when it's served. That smoky quality is what makes Nigerian jollof different from any other version. It's not very spicy. It's savoury and filling and very good with fried plantain alongside it."),
      h2("Beef Suya"),
      block("Suya is Nigerian street food — thin-cut beef coated in a dry spice blend called yaji (ground peanuts, ginger, paprika, chilli, aromatic spices) and grilled over charcoal. The peanut base forms a crust on the edges as the heat chars it. It smells like an outdoor grill should smell: smoke, spice, fat. The heat is present but not overwhelming — it comes from the spice blend and builds slowly rather than hitting you straight away. It arrives with raw sliced onion and fresh chilli. Order it as a starter, as a snack, or alongside rice."),
      h2("Egusi & Pounded Yam"),
      block("This is where it gets interesting. Egusi soup is made from ground melon seeds cooked in palm oil with leafy greens, stockfish, and protein — it's thick, nutty, and deeply savoury. Pounded yam is made from yam that has been boiled and pounded until it forms a smooth, elastic, stretchy dough. You eat the two together by pulling a piece of the pounded yam, shaping it slightly, and dipping it into the soup. No fork required. The swallow carries the soup and absorbs it. It's heavier than rice-based eating and more filling — the kind of meal you don't need a snack three hours later."),
      h2("Grilled Fish"),
      block("The Grilled Fish at NaijaGrill comes whole, charred over an open flame, served in a thick Nigerian pepper sauce with fried yam and sweet plantain on the side. The char on the skin is not accidental — it's the point. Underneath it the flesh is moist. The pepper sauce is intense and concentrated, built from scotch bonnet and tomatoes cooked down until raw is a memory. The sweet plantain is ripe, soft, and caramelised, which works exactly right against the heat of the sauce."),
      h2("Puff Puff"),
      block("End with puff puff. These are small fried dough balls — golden outside, soft and slightly chewy within, made from a yeasted batter that puffs up in the oil. They're not heavy. They're lightly sweet and addictive and the right size to eat in one bite. At every Nigerian party, puff puff is on the small chops tray and the tray is always empty first."),
      h2("A few notes before you go"),
      block("Nigerian food is generally eaten communally — sharing dishes at a table is the norm rather than everyone ordering their own. The restaurant seats about 25, so it's a proper dining room, not a canteen. Eating with your hands is common with swallow dishes and completely accepted. The staff will not look at you strangely if you ask what something is — asking is the right approach."),
      block("NaijaGrill is on Rookery Road in Handsworth, Birmingham — open from 2pm every day. Order on Uber Eats for delivery across Birmingham, or reserve a table at naijagrillandspice.co.uk/reservations. The first visit is easy. The second is habit."),
    ],
    seo: {
      _type: "seoMetadata",
      title: "Nigerian Food for Beginners — What to Order | NaijaGrill Birmingham",
      description: "New to Nigerian food? Here's what to order at NaijaGrill in Handsworth, Birmingham — jollof rice, suya, egusi, grilled fish, and puff puff, with honest descriptions of each.",
    },
  },
];

async function seed() {
  console.log(`Creating ${posts.length} blog posts in Sanity (${PROJECT_ID}/${DATASET})…\n`);

  for (const post of posts) {
    try {
      await client.createOrReplace(post);
      console.log(`✓ ${post.slug.current}`);
    } catch (err) {
      console.error(`✗ ${post.slug.current}:`, err.message);
    }
  }

  console.log("\nDone. Visit Sanity Studio to review and publish the posts.");
}

seed();
