/**
 * Shared HTTP Basic Auth check, used by src/middleware.ts to protect both
 * /admin and (from Milestone 7) /api/seo/status — ARCHITECTURE.md §7:
 * "the existing HTTP Basic Auth used by /admin (src/middleware.ts's matcher
 * extends to cover these paths once they're built)". One implementation,
 * not duplicated per route.
 */
export function isBasicAuthValid(authHeader: string | null, expectedUser: string, expectedPassword: string): boolean {
  if (!authHeader?.startsWith("Basic ")) return false;
  try {
    const decoded = atob(authHeader.slice(6));
    const separator = decoded.indexOf(":");
    if (separator === -1) return false;
    const user = decoded.slice(0, separator);
    const password = decoded.slice(separator + 1);
    return user === expectedUser && password === expectedPassword;
  } catch {
    return false;
  }
}
