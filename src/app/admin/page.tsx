import type { Metadata } from "next";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Owner Dashboard | NaijaGrill",
  robots: { index: false, follow: false },
};

// Always read fresh data; never cache the dashboard.
export const dynamic = "force-dynamic";

type TableKey =
  | "reservations"
  | "event_inquiries"
  | "contact_messages"
  | "newsletter_leads";

type Row = Record<string, unknown> & { created_at?: string };

type TableResult = {
  count: number | null;
  rows: Row[];
  error: string | null;
};

async function loadTable(table: TableKey): Promise<TableResult> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { count: null, rows: [], error: "not-configured" };

  const { data, count, error } = await supabase
    .from(table)
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(15);

  return {
    count: count ?? null,
    rows: (data ?? []) as Row[],
    error: error?.message ?? null,
  };
}

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80">
        {label}
      </p>
      <p className="mt-3 text-4xl font-semibold text-white">{value}</p>
    </div>
  );
}

function DataSection({
  title,
  result,
  columns,
}: {
  title: string;
  result: TableResult;
  columns: { key: string; label: string }[];
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <span className="text-sm text-white/50">
          {result.count ?? result.rows.length} total
        </span>
      </div>
      {result.rows.length === 0 ? (
        <p className="text-sm text-white/50">
          {result.error
            ? `Could not load (${result.error}).`
            : "No entries yet."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-white/50">
                {columns.map((col) => (
                  <th key={col.key} className="border-b border-white/10 px-3 py-2 font-medium">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, index) => (
                <tr key={index} className="align-top text-white/80">
                  {columns.map((col) => (
                    <td key={col.key} className="border-b border-white/5 px-3 py-2">
                      {col.key === "created_at"
                        ? formatDate(row.created_at)
                        : String(row[col.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default async function AdminDashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="min-h-screen bg-[#0f0c0a] px-6 py-20 text-white">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-semibold">Owner Dashboard</h1>
          <p className="mt-4 text-white/70">
            Supabase is not configured. Add{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
            and{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
            to view reservations, enquiries, messages, and newsletter sign-ups here.
          </p>
        </div>
      </main>
    );
  }

  const [reservations, events, contacts, newsletter] = await Promise.all([
    loadTable("reservations"),
    loadTable("event_inquiries"),
    loadTable("contact_messages"),
    loadTable("newsletter_leads"),
  ]);

  return (
    <main className="min-h-screen bg-[#0f0c0a] px-5 py-12 text-white md:px-10 md:py-16">
      <div className="mx-auto max-w-6xl space-y-10">
        <header>
          <p className="text-xs uppercase tracking-[0.28em] text-amber-300/80">
            NaijaGrill
          </p>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">
            Owner Dashboard
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Live leads from the website. Visible only to authenticated owners.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Reservations" value={reservations.count ?? "—"} />
          <StatCard label="Event enquiries" value={events.count ?? "—"} />
          <StatCard label="Contact messages" value={contacts.count ?? "—"} />
          <StatCard label="Newsletter" value={newsletter.count ?? "—"} />
        </div>

        <DataSection
          title="Latest reservations"
          result={reservations}
          columns={[
            { key: "created_at", label: "Received" },
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
            { key: "reservation_date", label: "Date" },
            { key: "guests", label: "Guests" },
            { key: "notes", label: "Notes" },
          ]}
        />

        <DataSection
          title="Latest event & catering enquiries"
          result={events}
          columns={[
            { key: "created_at", label: "Received" },
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
            { key: "event_type", label: "Type" },
            { key: "event_date", label: "Date" },
            { key: "guests", label: "Guests" },
            { key: "message", label: "Message" },
          ]}
        />

        <DataSection
          title="Latest contact messages"
          result={contacts}
          columns={[
            { key: "created_at", label: "Received" },
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
            { key: "message", label: "Message" },
          ]}
        />

        <DataSection
          title="Latest newsletter sign-ups"
          result={newsletter}
          columns={[
            { key: "created_at", label: "Received" },
            { key: "email", label: "Email" },
            { key: "source", label: "Source" },
          ]}
        />
      </div>
    </main>
  );
}
