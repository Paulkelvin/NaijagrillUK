import { beforeEach, describe, expect, it } from "vitest";
import {
  getCronSecret,
  getDataForSeoConfig,
  getGa4Config,
  getGscConfig,
  isCronSecretConfigured,
  isDataForSeoConfigured,
  isGa4Configured,
  isGscConfigured,
  normalizePrivateKey,
} from "./config";

const ENV_KEYS = [
  "GSC_CLIENT_EMAIL",
  "GSC_PRIVATE_KEY",
  "GSC_PROPERTY_URL",
  "GA4_CLIENT_EMAIL",
  "GA4_PRIVATE_KEY",
  "GA4_PROPERTY_ID",
  "CRON_SECRET",
  "DATAFORSEO_LOGIN",
  "DATAFORSEO_PASSWORD",
] as const;

const VALID_PEM_ESCAPED =
  "-----BEGIN PRIVATE KEY-----\\nMIIBVgIBADANBgkqhkiG9w0BAQ\\n-----END PRIVATE KEY-----\\n";
const VALID_PEM_REAL_NEWLINES =
  "-----BEGIN PRIVATE KEY-----\nMIIBVgIBADANBgkqhkiG9w0BAQ\n-----END PRIVATE KEY-----\n";

beforeEach(() => {
  for (const key of ENV_KEYS) delete process.env[key];
});

describe("normalizePrivateKey", () => {
  it("converts literal \\n sequences to real newlines", () => {
    const result = normalizePrivateKey(VALID_PEM_ESCAPED);
    expect(result).toBe(VALID_PEM_REAL_NEWLINES);
    expect(result).not.toContain("\\n");
  });

  it("is idempotent — leaves a key with real newlines unchanged", () => {
    expect(normalizePrivateKey(VALID_PEM_REAL_NEWLINES)).toBe(VALID_PEM_REAL_NEWLINES);
  });
});

describe("GSC config", () => {
  it("parses a valid full config correctly", () => {
    process.env.GSC_CLIENT_EMAIL = "seo-platform@project.iam.gserviceaccount.com";
    process.env.GSC_PRIVATE_KEY = VALID_PEM_ESCAPED;
    process.env.GSC_PROPERTY_URL = "https://www.naijagrillandspice.co.uk";

    expect(isGscConfigured()).toBe(true);
    const config = getGscConfig();
    expect(config.clientEmail).toBe("seo-platform@project.iam.gserviceaccount.com");
    expect(config.propertyUrl).toBe("https://www.naijagrillandspice.co.uk");
    // normalized on the way through
    expect(config.privateKey).toBe(VALID_PEM_REAL_NEWLINES);
  });

  it("isGscConfigured() returns false without throwing when a required var is missing", () => {
    process.env.GSC_CLIENT_EMAIL = "seo-platform@project.iam.gserviceaccount.com";
    process.env.GSC_PRIVATE_KEY = VALID_PEM_ESCAPED;
    // GSC_PROPERTY_URL intentionally left unset

    expect(() => isGscConfigured()).not.toThrow();
    expect(isGscConfigured()).toBe(false);
  });

  it("getGscConfig() throws a clear error when the private key is malformed", () => {
    process.env.GSC_CLIENT_EMAIL = "seo-platform@project.iam.gserviceaccount.com";
    process.env.GSC_PRIVATE_KEY = "not-a-pem-key-at-all";
    process.env.GSC_PROPERTY_URL = "https://www.naijagrillandspice.co.uk";

    expect(() => getGscConfig()).toThrow(/privateKey.*PEM private key/);
  });

  it("getGscConfig() throws when clientEmail is not a valid email", () => {
    process.env.GSC_CLIENT_EMAIL = "not-an-email";
    process.env.GSC_PRIVATE_KEY = VALID_PEM_ESCAPED;
    process.env.GSC_PROPERTY_URL = "https://www.naijagrillandspice.co.uk";

    expect(() => getGscConfig()).toThrow(/clientEmail/);
  });

  it("isGscConfigured() returns false when propertyUrl is not a valid URL", () => {
    process.env.GSC_CLIENT_EMAIL = "seo-platform@project.iam.gserviceaccount.com";
    process.env.GSC_PRIVATE_KEY = VALID_PEM_ESCAPED;
    process.env.GSC_PROPERTY_URL = "not-a-url";

    expect(isGscConfigured()).toBe(false);
  });
});

describe("GA4 config", () => {
  it("parses a valid full config correctly", () => {
    process.env.GA4_CLIENT_EMAIL = "seo-platform@project.iam.gserviceaccount.com";
    process.env.GA4_PRIVATE_KEY = VALID_PEM_REAL_NEWLINES;
    process.env.GA4_PROPERTY_ID = "123456789";

    expect(isGa4Configured()).toBe(true);
    const config = getGa4Config();
    expect(config.propertyId).toBe("123456789");
    expect(config.privateKey).toBe(VALID_PEM_REAL_NEWLINES);
  });

  it("isGa4Configured() returns false without throwing when propertyId is missing", () => {
    process.env.GA4_CLIENT_EMAIL = "seo-platform@project.iam.gserviceaccount.com";
    process.env.GA4_PRIVATE_KEY = VALID_PEM_REAL_NEWLINES;

    expect(() => isGa4Configured()).not.toThrow();
    expect(isGa4Configured()).toBe(false);
  });

  it("getGa4Config() throws a clear error when the private key is malformed", () => {
    process.env.GA4_CLIENT_EMAIL = "seo-platform@project.iam.gserviceaccount.com";
    process.env.GA4_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nmissing the end marker";
    process.env.GA4_PROPERTY_ID = "123456789";

    expect(() => getGa4Config()).toThrow(/privateKey.*PEM private key/);
  });
});

describe("DataForSEO config", () => {
  it("parses a valid full config correctly", () => {
    process.env.DATAFORSEO_LOGIN = "owner@naijagrillandspice.co.uk";
    process.env.DATAFORSEO_PASSWORD = "auto-generated-api-password";

    expect(isDataForSeoConfigured()).toBe(true);
    const config = getDataForSeoConfig();
    expect(config.login).toBe("owner@naijagrillandspice.co.uk");
    expect(config.password).toBe("auto-generated-api-password");
  });

  it("isDataForSeoConfigured() returns false without throwing when a required var is missing", () => {
    process.env.DATAFORSEO_LOGIN = "owner@naijagrillandspice.co.uk";
    // DATAFORSEO_PASSWORD intentionally left unset

    expect(() => isDataForSeoConfigured()).not.toThrow();
    expect(isDataForSeoConfigured()).toBe(false);
  });

  it("getDataForSeoConfig() throws a clear error when the login is not a valid email", () => {
    process.env.DATAFORSEO_LOGIN = "not-an-email";
    process.env.DATAFORSEO_PASSWORD = "auto-generated-api-password";

    expect(() => getDataForSeoConfig()).toThrow(/login/);
  });

  it("getDataForSeoConfig() throws when the password is an empty string", () => {
    process.env.DATAFORSEO_LOGIN = "owner@naijagrillandspice.co.uk";
    process.env.DATAFORSEO_PASSWORD = "";

    expect(() => getDataForSeoConfig()).toThrow(/password/);
  });
});

describe("cron secret", () => {
  it("isCronSecretConfigured() is false and getCronSecret() throws when unset", () => {
    expect(isCronSecretConfigured()).toBe(false);
    expect(() => getCronSecret()).toThrow(/CRON_SECRET/);
  });

  it("isCronSecretConfigured() is true and getCronSecret() returns the value when set", () => {
    process.env.CRON_SECRET = "a-long-random-string";
    expect(isCronSecretConfigured()).toBe(true);
    expect(getCronSecret()).toBe("a-long-random-string");
  });

  it("isCronSecretConfigured() is false for an empty string", () => {
    process.env.CRON_SECRET = "";
    expect(isCronSecretConfigured()).toBe(false);
  });
});
