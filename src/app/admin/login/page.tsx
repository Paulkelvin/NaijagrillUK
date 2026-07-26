import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Sign In | NaijaGrill",
  robots: { index: false, follow: false },
};

// Always fresh — reads the ?next=/?error= query params.
export const dynamic = "force-dynamic";

const INPUT_CLASS =
  "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-amber-300/60";
const LABEL_CLASS = "mb-1.5 block text-xs uppercase tracking-wide text-white/50";

interface AdminLoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const { next, error } = await searchParams;
  // Only ever redirect back into /admin — never an external URL, even if
  // someone crafts a link with a malicious ?next= value.
  const safeNext = next && next.startsWith("/admin") ? next : "/admin";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f0c0a] px-5 text-white">
      <div className="w-full max-w-sm">
        <p className="text-center text-xs uppercase tracking-[0.28em] text-amber-300/80">NaijaGrill</p>
        <h1 className="mt-2 text-center text-2xl font-semibold">Admin sign in</h1>

        {error && (
          <p className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2 text-center text-sm text-red-200">
            {error === "rate_limited"
              ? "Too many sign-in attempts. Please wait a few minutes and try again."
              : "Incorrect username or password."}
          </p>
        )}

        <form method="POST" action="/api/admin/login" className="mt-6 space-y-4">
          <input type="hidden" name="next" value={safeNext} />
          <div>
            <label htmlFor="username" className={LABEL_CLASS}>
              Username
            </label>
            <input id="username" name="username" type="text" autoComplete="username" defaultValue="admin" required className={INPUT_CLASS} />
          </div>
          <div>
            <label htmlFor="password" className={LABEL_CLASS}>
              Password
            </label>
            <input id="password" name="password" type="password" autoComplete="current-password" required className={INPUT_CLASS} />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg border border-amber-300/40 bg-amber-300/10 px-3 py-2.5 font-medium text-amber-200 transition hover:bg-amber-300/20"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/40">You&apos;ll stay signed in for 90 days.</p>
      </div>
    </main>
  );
}
