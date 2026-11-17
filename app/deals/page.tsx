
import Link from "next/link";
import { connection } from "next/server";

export const instant = false;

type Deal = {
  id: number;
  business_name: string;
  title: string;
  description: string;
  category: string | null;
  offer_url: string | null;
  valid_until: string | null;
  created_at: string;
};

async function getApprovedDeals(): Promise<Deal[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    console.error("Supabase public configuration is missing.");
    return [];
  }

  const today = new Date().toISOString().slice(0, 10);

  const url = new URL(
    "/rest/v1/deals",
    supabaseUrl.replace(/\/+$/, "") + "/"
  );

  url.searchParams.set(
    "select",
    "id,business_name,title,description,category,offer_url,valid_until,created_at"
  );
  url.searchParams.set("status", "eq.approved");
  url.searchParams.set(
    "or",
    `(valid_until.is.null,valid_until.gte.${today})`
  );
  url.searchParams.set("order", "created_at.desc");

  try {
    const response = await fetch(url.toString(), {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Deals request failed:", response.status);
      return [];
    }

    const data: Deal[] = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to load deals:", error);
    return [];
  }
}

const categories = [
  {
    title: "Technology",
    description: "Gadgets, electronics and smart devices.",
    icon: "💻",
  },
  {
    title: "Shopping",
    description: "Fashion, accessories and shopping offers.",
    icon: "🛍️",
  },
  {
    title: "Education",
    description: "Courses, learning tools and study resources.",
    icon: "📚",
  },
  {
    title: "Lifestyle",
    description: "Useful products and everyday services.",
    icon: "✨",
  },
];

export default async function DealsPage() {
  await connection();

  const deals = await getApprovedDeals();

  return (
    <main className="min-h-screen bg-[#F5F0E6] text-[#123D2B]">
      {/* Navigation */}
      <nav className="sticky top-0 z-30 border-b border-[#D4AF37]/30 bg-[#123D2B]/95 px-5 py-5 text-white shadow-lg backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="text-2xl font-black tracking-tight text-white">
            ALI<span className="text-[#D4AF37]">QO</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/advertisements"
              className="hidden rounded-full border border-[#D4AF37]/50 px-4 py-2 text-xs font-bold text-[#D4AF37] transition hover:bg-white/10 sm:block"
            >
              Advertisements
            </Link>

            <Link
              href="/"
              className="rounded-full bg-[#D4AF37] px-5 py-2.5 text-xs font-bold text-[#123D2B] transition hover:bg-[#E8C95B]"
            >
              Back to Search
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-5 py-24 text-center sm:py-32">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-0 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-r from-[#D4AF37]/20 via-[#FFFFFF]/70 to-[#123D2B]/10 blur-[100px]" />

        <div className="relative mx-auto max-w-4xl">
          <span className="inline-block rounded-full border border-[#D4AF37]/50 bg-white px-5 py-2 text-xs font-bold tracking-[0.25em] text-[#85631B]">
            ALIQO DISCOVERY
          </span>

          <h1 className="mt-8 text-5xl font-black tracking-tight text-[#123D2B] sm:text-7xl">
            Discover More.
            <span className="mt-2 block text-[#B08B22]">
              Save More.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-[#68766D] sm:text-lg">
            Explore products, discover useful services and find exciting
            shopping opportunities — all in one place.
          </p>

          <Link
            href="/advertisements"
            className="mt-9 inline-block rounded-full bg-[#123D2B] px-8 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-[#1B563C]"
          >
            Explore Businesses →
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-10">
          <span className="text-xs font-bold tracking-[0.2em] text-[#B08B22]">
            EXPLORE
          </span>

          <h2 className="mt-3 text-3xl font-black text-[#123D2B] sm:text-4xl">
            Explore Categories
          </h2>

          <p className="mt-3 text-[#68766D]">
            Discover opportunities across different categories.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <div
              key={category.title}
              className="rounded-3xl border border-[#DED5C2] bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-xl"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#F5F0E6] text-3xl">
                {category.icon}
              </div>

              <h3 className="text-xl font-extrabold text-[#123D2B]">
                {category.title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-[#68766D]">
                {category.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Deals */}
      <section className="border-y border-[#DED5C2] bg-white px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10">
            <span className="text-xs font-bold tracking-[0.2em] text-[#B08B22]">
              SPECIAL DISCOVERY
            </span>

            <h2 className="mt-3 text-3xl font-black text-[#123D2B] sm:text-4xl">
              Featured Deals
            </h2>

            <p className="mt-3 text-[#68766D]">
              Discover approved offers and shopping opportunities.
            </p>
          </div>

          {deals.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {deals.map((deal) => (
                <article
                  key={deal.id}
                  className="rounded-3xl border border-[#DED5C2] bg-[#F5F0E6] p-7 transition hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-lg"
                >
                  <span className="inline-block rounded-full border border-[#D4AF37]/40 bg-white px-3 py-1 text-xs font-bold text-[#85631B]">
                    {deal.category || "Special Offer"}
                  </span>

                  <h3 className="mt-5 text-xl font-extrabold text-[#123D2B]">
                    {deal.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-[#68766D]">
                    {deal.description}
                  </p>

                  <p className="mt-5 text-sm font-bold text-[#123D2B]">
                    {deal.business_name}
                  </p>

                  {deal.valid_until && (
                    <p className="mt-2 text-xs text-[#68766D]">
                      Valid until: {deal.valid_until}
                    </p>
                  )}

                  {deal.offer_url && (
                    <a
                      href={deal.offer_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 inline-block rounded-full bg-[#123D2B] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1B563C]"
                    >
                      View Offer →
                    </a>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-[#DED5C2] bg-[#F5F0E6] p-10 text-center">
              <div className="text-5xl">🎁</div>

              <h3 className="mt-4 text-xl font-bold text-[#123D2B]">
                No Active Deals Yet
              </h3>

              <p className="mt-3 text-sm text-[#68766D]">
                New approved offers will appear here.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Business Promotion */}
      <section className="mx-auto max-w-5xl px-5 py-20">
        <div className="rounded-[2rem] border border-[#D4AF37]/40 bg-[#123D2B] p-9 text-center text-white shadow-xl sm:p-14">
          <span className="text-xs font-bold tracking-[0.25em] text-[#D4AF37]">
            GROW WITH ALIQO
          </span>

          <h2 className="mt-5 text-3xl font-black text-white sm:text-4xl">
            Have an Offer to Share?
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-8 text-white/80">
            Bring your business and special offers to the ALIQO discovery
            platform.
          </p>

          <Link
            href="/advertise"
            className="mt-8 inline-block rounded-full bg-[#D4AF37] px-8 py-4 font-bold text-[#123D2B] transition hover:bg-[#E8C95B]"
          >
            Promote Your Business →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#D4AF37]/30 bg-[#123D2B] px-5 py-10 text-center text-sm text-white/75">
        <Link href="/" className="text-2xl font-black text-white">
          ALI<span className="text-[#D4AF37]">QO</span>
        </Link>

        <p className="mt-3">Explore more. Discover more.</p>

        <div className="mt-6 flex flex-wrap justify-center gap-6">
          <Link href="/" className="transition hover:text-[#D4AF37]">
            Home
          </Link>
          <Link href="/deals" className="transition hover:text-[#D4AF37]">
            Deals
          </Link>
          <Link href="/advertisements" className="transition hover:text-[#D4AF37]">
            Advertisements
          </Link>
          <Link href="/advertise" className="transition hover:text-[#D4AF37]">
            Advertise With Us
          </Link>
        </div>

        <p className="mt-8 text-xs text-white/50">
          © 2026 ALIQO. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
