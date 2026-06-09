import { createClient } from "next-sanity";
import {
  isSanityConfigured,
  sanityApiVersion,
  sanityDataset,
  sanityProjectId,
} from "./env";

export const sanityClient = isSanityConfigured
  ? createClient({
      projectId: sanityProjectId!,
      dataset: sanityDataset,
      apiVersion: sanityApiVersion,
      useCdn: process.env.NODE_ENV === "production",
    })
  : null;
