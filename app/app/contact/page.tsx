
export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#F5F0E6] text-[#123D2B]">
      <nav className="border-b border-[#D4AF37]/30 bg-[#123D2B] px-6 py-5">
        <a href="/" className="text-2xl font-black tracking-wide text-white">
          ALI<span className="text-[#D4AF37]">QO</span>
        </a>
      </nav>

      <article className="mx-auto max-w-3xl px-6 py-20">
        <p className="mb-3 font-bold tracking-widest text-[#A17C26]">
          WE ARE HERE TO HELP
        </p>

        <h1 className="mb-6 text-4xl font-black text-[#123D2B]">
          Contact Us
        </h1>

        <p className="mb-10 leading-8 text-[#68766D]">
          Thank you for visiting ALIQO. We welcome your questions,
          suggestions, feedback, and business inquiries.
        </p>

        <section className="mb-8 rounded-2xl border border-[#DED5C2] bg-white p-8 shadow-sm">
          <h2 className="mb-3 text-2xl font-extrabold text-[#123D2B]">
            Get in Touch
          </h2>

          <p className="mb-5 leading-7 text-[#68766D]">
            For support, business inquiries, or general questions,
            contact our team by email.
          </p>

          <a
            href="mailto:aliqo37311011@gmail.com"
            className="font-bold text-[#8A6B1F] transition hover:text-[#123D2B]"
          >
            aliqo37311011@gmail.com
          </a>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-2xl font-extrabold text-[#123D2B]">
            Your Feedback Matters
          </h2>

          <p className="leading-8 text-[#68766D]">
            Your feedback helps us improve ALIQO and make the search
            experience more useful and accessible.
          </p>
        </section>

        <a
          href="/"
          className="inline-block rounded-full bg-[#123D2B] px-8 py-3 font-bold text-[#D4AF37] shadow-sm transition hover:bg-[#1B563C]"
        >
          Back to Home
        </a>
      </article>

      <footer className="border-t border-[#D4AF37]/30 bg-[#123D2B] px-6 py-8 text-center text-sm text-white">
        © 2026 ALIQO. All rights reserved.
      </footer>
    </main>
  );
}
