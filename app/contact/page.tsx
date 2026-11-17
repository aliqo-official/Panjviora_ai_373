
export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#F5F0E6] text-[#123D2B]">
      {/* Header */}
      <header className="border-b border-[#D4AF37]/30 bg-[#123D2B] px-5 py-5 shadow-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <a
            href="/"
            className="text-3xl font-black tracking-wide text-white"
          >
            ALI<span className="text-[#D4AF37]">QO</span>
          </a>

          <span className="rounded-full border border-[#D4AF37]/50 px-4 py-2 text-sm font-semibold text-[#D4AF37]">
            Contact Us
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-[#DED5C2] bg-[#123D2B] px-5 py-16 text-center sm:py-20">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
          WE ARE HERE TO HELP
        </p>

        <h1 className="text-4xl font-black text-white sm:text-5xl">
          Contact Us
        </h1>

        <p className="mx-auto mt-5 max-w-xl leading-8 text-white/80">
          Have a question, suggestion, or business inquiry?
          We would love to hear from you.
        </p>

        <div className="mx-auto mt-8 h-1 w-24 rounded-full bg-[#D4AF37]" />
      </section>

      {/* Contact Content */}
      <section className="mx-auto max-w-5xl px-5 py-14 sm:py-16">
        <div className="grid gap-7 md:grid-cols-2">

          {/* Email Card */}
          <div className="rounded-3xl border border-[#DED5C2] bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-lg">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#F5F0E6] text-3xl text-[#B08B22]">
              ✉
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B08B22]">
              Get in Touch
            </p>

            <h2 className="mt-3 text-2xl font-black text-[#123D2B]">
              Email Support
            </h2>

            <p className="mt-4 leading-7 text-[#68766D]">
              For questions, technical support, or general inquiries,
              contact our team through email.
            </p>

            <a
              href="mailto:aliqo37311011@gmail.com"
              className="mt-6 inline-block break-all font-bold text-[#1B563C] underline underline-offset-4 transition hover:text-[#B08B22]"
            >
              aliqo37311011@gmail.com
            </a>
          </div>

          {/* Feedback Card */}
          <div className="rounded-3xl border border-[#DED5C2] bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-[#D4AF37] hover:shadow-lg">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#F5F0E6] text-3xl text-[#B08B22]">
              ★
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B08B22]">
              Your Voice Matters
            </p>

            <h2 className="mt-3 text-2xl font-black text-[#123D2B]">
              Your Feedback Matters
            </h2>

            <p className="mt-4 leading-7 text-[#68766D]">
              Your suggestions help us improve ALIQO. Share your
              ideas, report an issue, or tell us about your experience.
            </p>

            <a
              href="mailto:aliqo37311011@gmail.com?subject=ALIQO%20Feedback"
              className="mt-6 inline-flex rounded-xl bg-[#123D2B] px-6 py-3 font-bold text-white transition hover:bg-[#1B563C]"
            >
              Send Your Feedback →
            </a>
          </div>
        </div>

        {/* Message Section */}
        <div className="mt-8 rounded-3xl border border-[#D4AF37]/40 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F0E6] text-3xl">
            🤝
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#B08B22]">
            ALIQO SUPPORT
          </p>

          <h2 className="mt-3 text-2xl font-black text-[#123D2B] sm:text-3xl">
            We Appreciate Your Trust
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-8 text-[#68766D]">
            We are continuously working to make your search
            experience better, smarter, and more useful.
            Thank you for being part of ALIQO.
          </p>

          <a
            href="/"
            className="mt-8 inline-flex rounded-xl bg-[#123D2B] px-7 py-3.5 font-bold text-white transition hover:bg-[#1B563C]"
          >
            ← Back to Home
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#D4AF37]/30 bg-[#123D2B] px-5 py-9 text-center">
        <a href="/" className="text-2xl font-black text-white">
          ALI<span className="text-[#D4AF37]">QO</span>
        </a>

        <p className="mt-4 text-sm text-white/75">
          © 2026 ALIQO. All rights reserved.
        </p>

        <p className="mt-2 text-xs font-semibold text-[#D4AF37]">
          Search Smarter. Discover More.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-white/75">
          <a href="/" className="transition hover:text-[#D4AF37]">
            Home
          </a>
          <a href="/about" className="transition hover:text-[#D4AF37]">
            About
          </a>
          <a href="/privacy" className="transition hover:text-[#D4AF37]">
            Privacy
          </a>
          <a href="/terms" className="transition hover:text-[#D4AF37]">
            Terms
          </a>
        </div>
      </footer>
    </main>
  );
}
