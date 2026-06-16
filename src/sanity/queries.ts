export const homepageQuery = `*[_type == "homepage"][0]{
  heroEyebrow, heroHeadline, heroSubtext, heroImage,
  storyEyebrow, storyHeadline, storyParagraphs, storyImage,
  cuisineEyebrow, cuisineHeadline, cuisineFeatures,
  experienceEyebrow, experienceHeadline, experienceBody, experienceImage,
  videoEyebrow, videoHeadline, videoBody,
  videos[]{ title, url, orientation, poster, "fileUrl": videoFile.asset->url },
  visitHeadline, visitImage, seo
}`;

export const menuItemsQuery = `*[_type == "menuItem"] | order(order asc){
  _id, title, description, price, section, image, localImage, badge, orderable, uberEatsUrl, order, seo
}`;

export const testimonialsQuery = `*[_type == "testimonial"] | order(order asc){
  _id, quote, author, context
}`;

export const openingHoursQuery = `*[_type == "openingHours"][0]{
  summary, lunchHours, dinnerHours, schedule
}`;

export const contactInfoQuery = `*[_type == "contactInfo"][0]{
  email, phone, landline, street, area, city, postcode, country, locationNote, instagram
}`;

export const blogPostsQuery = `*[_type == "blogPost"] | order(publishedAt desc){
  _id, title, "slug": slug.current, excerpt, featuredImage, author, publishedAt,
  category->{ _id, title, "slug": slug.current, description }
}`;

export const blogPostBySlugQuery = `*[_type == "blogPost" && slug.current == $slug][0]{
  _id, title, "slug": slug.current, excerpt, featuredImage, author, publishedAt, body, faqs,
  category->{ _id, title, "slug": slug.current, description },
  relatedPosts[]->{ _id, title, "slug": slug.current, excerpt, featuredImage, author, publishedAt,
    category->{ _id, title, "slug": slug.current }
  },
  seo
}`;

export const blogPostsByCategoryQuery = `*[_type == "blogPost" && category->slug.current == $category] | order(publishedAt desc){
  _id, title, "slug": slug.current, excerpt, featuredImage, author, publishedAt,
  category->{ _id, title, "slug": slug.current, description }
}`;

export const blogCategoriesQuery = `*[_type == "blogCategory"] | order(title asc){
  _id, title, "slug": slug.current, description
}`;

export const eventsQuery = `*[_type == "event"] | order(eventDate desc){
  _id, title, "slug": slug.current, excerpt, featuredImage, eventDate, location, seo
}`;

export const galleryImagesQuery = `*[_type == "galleryImage"] | order(order asc){
  _id, title, image, alt, caption, order
}`;

export const explorePageQuery = `*[_type == "explorePage"][0]{
  title, subtitle, heroImage, introduction, sections, faqs, seo
}`;

export const allSlugsQuery = `{
  "blog": *[_type == "blogPost"]{ "slug": slug.current },
  "events": *[_type == "event"]{ "slug": slug.current }
}`;
