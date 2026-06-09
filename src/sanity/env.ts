export const sanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
export const sanityDataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
export const sanityApiVersion = "2024-01-01";

export const isSanityConfigured = Boolean(sanityProjectId && sanityDataset);
