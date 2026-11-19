
{/* Contact CTA */}
<section
  className="relative isolate overflow-hidden rounded-3xl p-8 text-center shadow-lg sm:p-12"
  style={{
    backgroundColor: "#064B38",
    color: "#FFFFFF",
  }}
>
  <div
    className="relative z-10 mx-auto mb-5 h-1.5 w-20 rounded-full"
    style={{
      backgroundColor: "#D6B45B",
      opacity: 1,
      visibility: "visible",
    }}
  />

  <h2
    className="relative z-10 text-2xl font-extrabold sm:text-3xl"
    style={{
      color: "#FFFFFF",
      opacity: 1,
      visibility: "visible",
      display: "block",
      transition: "none",
      textShadow: "0 2px 8px rgba(0,0,0,0.3)",
    }}
  >
    Interested in {institutionName}?
  </h2>

  <p
    className="relative z-10 mx-auto mt-4 max-w-2xl leading-7"
    style={{
      color: "#F7F3E8",
      opacity: 1,
      visibility: "visible",
      display: "block",
      transition: "none",
    }}
  >
    Contact the institution directly for admission and further details.
  </p>

  <div className="relative z-10 mt-7 flex flex-wrap justify-center gap-3">
    {institution.phone && (
      <a
        href={`tel:${institution.phone}`}
        className="rounded-xl px-7 py-3 font-extrabold transition-colors"
        style={{
          backgroundColor: "#D6B45B",
          color: "#064B38",
          opacity: 1,
          visibility: "visible",
        }}
      >
        Contact Institution
      </a>
    )}

    {whatsappLink && (
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-xl border-2 px-7 py-3 font-bold transition-colors hover:bg-white hover:text-[#064B38]"
        style={{
          borderColor: "#D6B45B",
          color: "#FFFFFF",
          opacity: 1,
          visibility: "visible",
        }}
      >
        WhatsApp Us
      </a>
    )}
  </div>
</section>
