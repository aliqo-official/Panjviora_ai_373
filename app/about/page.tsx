
import Link from "next/link";

const features = [
  {
    title: "Web Search",
    description:
      "Explore websites, discover useful information, and find relevant content from across the internet.",
  },
  {
    title: "Image Search",
    description:
      "Discover images and visual content to explore ideas, creativity, and inspiration.",
  },
  {
    title: "Video Search",
    description:
      "Find and explore videos from YouTube through one convenient search experience.",
  },
  {
    title: "AI-Powered Search",
    description:
      "Explore AI-assisted answers and insights to make information discovery more convenient.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#F5F0E6] text-[#123D2B]">
      {/* Navigation */}
      <nav className="border-b border-[#D4AF37]/30 bg-[#123D2B] px-5 py-5 shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="text-3xl font-black tracking-wide text-white"
          >
            ALI<span className="text-[#D4AF37]">QO</span>
          </Link>

          <Link
            href="/"
            className="rounded-full border border-[#D4AF37] px-6 py-2.5 text-sm font-bold text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-[#123D2B]"
          >
            Home
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden border-b border-[#DED5C2] px-5 py-20 text-center sm:py-28">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-0 h-80 w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-r from-[#D4AF37]/15 via-white/70 to-[#123D2B]/10 blur-[100px]" />

        <div className="relative mx-auto max-w-4xl">
          <span className="inline-block rounded-full border border-[#D4AF37]/50 bg-white px-5 py-2 text-xs font-bold tracking-[0.25em] text-[#85631B]">
            DISCOVER ALIQO
          </span>

          <h1 className="mt-7 text-4xl font-black tracking-tight text-[#123D2B] sm:text-6xl">
            About <span className="text-[#B08B22]">ALIQO</span>
          </h1>

          <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-[#68766D] sm:text-lg">
            Welcome to ALIQO — a modern search and discovery platform
            designed to bring web search, images, videos, and
            AI-assisted discovery together in one convenient place.
          </p>

          <p className="mt-7 text-xl font-bold text-[#B08B22]">
            Discover More. Search Smarter.
          </p>

          <div className="mx-auto mt-8 h-1 w-24 rounded-full bg-[#D4AF37]" />
        </div>
      </header>

      <article className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        {/* What Makes ALIQO Different */}
        <section className="mb-16 rounded-3xl border border-[#DED5C2] bg-white p-8 shadow-sm sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B08B22]">
            About Our Platform
          </p>

          <h2 className="mb-5 mt-3 text-2xl font-black text-[#123D2B] sm:text-3xl">
            What Makes ALIQO Different?
          </h2>

          <p className="max-w-4xl leading-8 text-[#68766D]">
            ALIQO brings different ways of discovering information
            together in one platform. Instead of limiting users
            to one type of search, we aim to make exploring
            information, visual content, videos, and AI-assisted
            insights easier and more convenient.
          </p>
        </section>

        {/* Features */}
        <section className="mb-20">
          <div className="mb-9">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B08B22]">
              Platform Capabilities
            </p>

            <h2 className="mt-3 text-3xl font-black text-[#123D2B]">
              Explore ALIQO Features
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group rounded-3xl border border-[#DED5C2] bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#D4AF37]/30 bg-[#F5F0E6] font-black text-[#B08B22]">
                  0{index + 1}
                </div>

                <h3 className="mb-3 mt-6 text-xl font-extrabold text-[#123D2B]">
                  {feature.title}
                </h3>

                <p className="leading-7 text-[#68766D]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Business Opportunities */}
        <section className="mb-20 overflow-hidden rounded-3xl border border-[#D4AF37]/40 bg-[#123D2B] p-8 text-white shadow-lg sm:p-12">
          <p className="mb-4 text-xs font-bold tracking-[0.25em] text-[#D4AF37]">
            BUSINESS WITH ALIQO
          </p>

          <h2 className="mb-5 text-3xl font-black text-white">
            Advertising & Business Opportunities
          </h2>

          <p className="mb-7 max-w-4xl leading-8 text-white/80">
            ALIQO also aims to create opportunities for businesses,
            brands, startups, and entrepreneurs. We welcome
            advertising inquiries, promotional proposals,
            partnerships, and other business-related collaborations.
          </p>

          <ul className="mb-9 grid gap-4 leading-7 text-white/90 sm:grid-cols-2">
            <li className="flex gap-3">
              <span className="font-bold text-[#D4AF37]">✓</span>
              Promote your products and services.
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-[#D4AF37]">✓</span>
              Explore advertising opportunities.
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-[#D4AF37]">✓</span>
              Build brand awareness and online visibility.
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-[#D4AF37]">✓</span>
              Discuss business partnerships and collaborations.
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-[#D4AF37]">✓</span>
              Submit marketing and promotional proposals.
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-[#D4AF37]">✓</span>
              Contact us for other business-related opportunities.
            </li>
          </ul>

          <Link
            href="/advertise"
            className="inline-block rounded-xl bg-[#D4AF37] px-7 py-3.5 font-bold text-[#123D2B] transition hover:bg-[#E8C95B]"
          >
            Advertise With ALIQO →
          </Link>
        </section>

        {/* Mission */}
        <section className="mb-8 rounded-3xl border border-[#DED5C2] bg-white p-8 shadow-sm sm:p-10">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5F0E6] text-2xl">
            🎯
          </div>

          <h2 className="mb-5 text-2xl font-black text-[#123D2B] sm:text-3xl">
            Our Mission
          </h2>

          <p className="leading-8 text-[#68766D]">
            Our mission is to make information discovery easier,
            more accessible, and more convenient while creating
            opportunities for businesses through digital promotion
            and collaboration.
          </p>
        </section>

        {/* Vision */}
        <section className="mb-20 rounded-3xl border border-[#DED5C2] bg-white p-8 shadow-sm sm:p-10">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5F0E6] text-2xl">
            🌟
          </div>

          <h2 className="mb-5 text-2xl font-black text-[#123D2B] sm:text-3xl">
            Our Vision
          </h2>

          <p className="leading-8 text-[#68766D]">
            Our vision is to build a modern destination where
            people can search, explore, learn, and discover
            opportunities. We aim to continuously improve ALIQO
            through technology and a user-focused experience.
          </p>
        </section>

        {/* Contact */}
        <section className="mb-16 rounded-3xl border border-[#D4AF37]/40 bg-[#F5F0E6] p-8 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B08B22]">
            Get in Touch
          </p>

          <h2 className="mb-5 mt-3 text-2xl font-black text-[#123D2B] sm:text-3xl">
            Contact Us
          </h2>

          <p className="mb-5 leading-8 text-[#68766D]">
            Have a question, suggestion, advertising inquiry,
            or business proposal? We would be happy to hear from you.
          </p>

          <a
            href="mailto:aliqo37311011@gmail.com"
            className="font-bold text-[#1B563C] transition hover:text-[#B08B22]"
          >
            aliqo37311011@gmail.com
          </a>
        </section>

        {/* Closing */}
        <section className="rounded-3xl border border-[#D4AF37]/40 bg-[#123D2B] px-6 py-14 text-center shadow-xl sm:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
            Discover the ALIQO Experience
          </p>

          <h2 className="mt-5 text-3xl font-black text-white sm:text-4xl">
            ALIQO — Search Beyond Limits.
          </h2>

          <p className="mt-5 text-base font-semibold text-[#D4AF37] sm:text-lg">
            Explore More. Discover Better. Grow Together.
          </p>

          <Link
            href="/"
            className="mt-9 inline-block rounded-xl border border-[#D4AF37] px-8 py-3.5 font-bold text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-[#123D2B]"
          >
            Back to Home
          </Link>
        </section>
      </article>

      {/* Footer */}
      <footer className="border-t border-[#D4AF37]/30 bg-[#123D2B] px-5 py-9 text-center text-sm text-white/75">
        <Link href="/" className="text-2xl font-black text-white">
          ALI<span className="text-[#D4AF37]">QO</span>
        </Link>

        <p className="mt-3">Explore More. Discover Better. Grow Together.</p>

        <div className="mt-6 flex flex-wrap justify-center gap-6">
          <Link href="/" className="transition hover:text-[#D4AF37]">
            Home
          </Link>
          <Link href="/advertisements" className="transition hover:text-[#D4AF37]">
            Advertisements
          </Link>
          <Link href="/advertise" className="transition hover:text-[#D4AF37]">
            Advertise With Us
          </Link>
          <Link href="/contact" className="transition hover:text-[#D4AF37]">
            Contact
          </Link>
        </div>

        <p className="mt-8 text-xs text-white/50">
          © 2026 ALIQO. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
