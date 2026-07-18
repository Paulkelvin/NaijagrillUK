import { z } from "zod";

// The only module permitted to read process.env for SEO-platform variables
// (ENGINEERING_STANDARDS.md §7). Every sync job gets its config through the
// getXConfig()/isXConfigured() pairs below, never process.env directly.

/**
 * Service-account private keys are usually pasted into a single-line env
 * var with literal `\n` sequences standing in for real newlines (some
 * hosting UIs strip actual newlines from env var values). This normalizes
 * both forms to a real, multi-line PEM string. Idempotent: a key that
 * already has real newlines and no literal `\n` is returned unchanged.
 */
export function normalizePrivateKey(raw: string): string {
  return raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
}

const pemPrivateKeySchema = z
  .string()
  .min(1, "Private key is empty")
  .transform((val) => normalizePrivateKey(val))
  .refine(
    (val) => val.includes("-----BEGIN PRIVATE KEY-----") && val.includes("-----END PRIVATE KEY-----"),
    { message: "Not a valid PEM private key (missing BEGIN/END PRIVATE KEY markers)" },
  );

const gscConfigSchema = z.object({
  clientEmail: z.string().email("GSC_CLIENT_EMAIL must be a valid email address"),
  privateKey: pemPrivateKeySchema,
  propertyUrl: z.string().url("GSC_PROPERTY_URL must be a valid URL"),
});

const ga4ConfigSchema = z.object({
  clientEmail: z.string().email("GA4_CLIENT_EMAIL must be a valid email address"),
  privateKey: pemPrivateKeySchema,
  propertyId: z.string().min(1, "GA4_PROPERTY_ID is required"),
});

export type GscConfig = z.infer<typeof gscConfigSchema>;
export type Ga4Config = z.infer<typeof ga4ConfigSchema>;

function readGscEnv() {
  return {
    clientEmail: process.env.GSC_CLIENT_EMAIL,
    privateKey: process.env.GSC_PRIVATE_KEY,
    propertyUrl: process.env.GSC_PROPERTY_URL,
  };
}

function readGa4Env() {
  return {
    clientEmail: process.env.GA4_CLIENT_EMAIL,
    privateKey: process.env.GA4_PRIVATE_KEY,
    propertyId: process.env.GA4_PROPERTY_ID,
  };
}

function formatIssues(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`).join("; ");
}

/** Never throws — safe to call at any point, including render/UI logic. */
export function isGscConfigured(): boolean {
  return gscConfigSchema.safeParse(readGscEnv()).success;
}

/**
 * Throws with a clear, field-level message if config is missing or
 * malformed. Callers (sync jobs) are expected to check isGscConfigured()
 * first if they want to skip rather than fail — this fails fast and loud
 * for the case where a job proceeds assuming config is present.
 */
export function getGscConfig(): GscConfig {
  const result = gscConfigSchema.safeParse(readGscEnv());
  if (!result.success) {
    throw new Error(`Invalid GSC configuration: ${formatIssues(result.error)}`);
  }
  return result.data;
}

export function isGa4Configured(): boolean {
  return ga4ConfigSchema.safeParse(readGa4Env()).success;
}

export function getGa4Config(): Ga4Config {
  const result = ga4ConfigSchema.safeParse(readGa4Env());
  if (!result.success) {
    throw new Error(`Invalid GA4 configuration: ${formatIssues(result.error)}`);
  }
  return result.data;
}

/**
 * Authenticates cron-triggered API routes (ARCHITECTURE.md §7). Not a
 * secret used by an external API, so no Zod schema beyond non-empty-string
 * — mirrors the existing ADMIN_PASSWORD check pattern in src/middleware.ts.
 */
export function isCronSecretConfigured(): boolean {
  return typeof process.env.CRON_SECRET === "string" && process.env.CRON_SECRET.length > 0;
}

export function getCronSecret(): string {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    throw new Error("CRON_SECRET is not configured");
  }
  return secret;
}
