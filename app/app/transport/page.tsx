
"use client";

import { useState, type FormEvent } from "react";

type TransportType = "bus" | "train" | "airline";

const cities = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Hyderabad",
  "Sialkot",
  "Gujranwala",
  "Bahawalpur",
];

const options = [
  {
    id: "bus",
    name: "Bus",
    icon: "🚌",
    description: "Explore bus journeys across Pakistan",
  },
  {
    id: "train",
    name: "Train",
    icon: "🚆",
    description: "Explore railway journeys",
  },
  {
    id: "airline",
    name: "Airline",
    icon: "✈️",
    description: "Explore domestic and international flights",
  },
] as const;

export default function TransportPage() {
  const [transport, setTransport] = useState<TransportType>("bus");
  const [from, setFrom] = useState("Karachi");
  const [to, setTo] = useState("Lahore");
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState("1");
  const [message, setMessage] = useState("");
  const [searchDetails, setSearchDetails] = useState("");

  function swapCities() {
    setFrom(to);
    setTo(from);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSearchDetails("");

    if (from === to) {
      setMessage("Departure and destination cities must be different.");
      return;
    }

    if (!date) {
      setMessage("Please select your travel date.");
      return;
    }

    const selectedDate = new Date(`${date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setMessage("Please select today or a future travel date.");
      return;
    }

    const typeName =
      transport === "bus"
        ? "Bus"
        : transport === "train"
          ? "Train"
          : "Airline";

    setSearchDetails(
      `${typeName} journey: ${from} to ${to} | Date: ${date} | Passengers: ${passengers}`
    );
  }

  return (
    <main className="min-h-screen bg-[#F3F6F1] text-[#10271D]">
      <header className="border-b border-[#D9E2D8] bg-[#10271D] px-5 py-5 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <a href="/" className="text-2xl font-black">
            ALI<span className="text-[#E4C35D]">QO</span>
          </a>

          <nav className="flex items-center gap-4 text-sm font-semibold sm:gap-6">
            <a href="/" className="transition hover:text-[#E4C35D]">
              Home
            </a>
            <a href="/marketplace" className="transition hover:text-[#E4C35D]">
              Marketplace
            </a>
            <a href="/advertisements" className="transition hover:text-[#E4C35D]">
              Advertisements
            </a>
          </nav>
        </div>
      </header>

      <section className="px-5 py-16">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A17C26]">
            ALIQO TRAVEL SERVICES
          </p>

          <h1 className="mt-4 text-4xl font-black sm:text-5xl">
            Travel Across Your World
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#647468]">
            Discover bus, train and airline travel options through one
            convenient platform.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="rounded-3xl border border-[#D9E2D8] bg-white p-6 shadow-sm sm:p-9">
          <div className="grid gap-4 sm:grid-cols-3">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setTransport(option.id);
                  setMessage("");
                  setSearchDetails("");
                }}
                className={`rounded-2xl border p-5 text-left transition ${
                  transport === option.id
                    ? "border-[#C49A32] bg-[#F7F0D9]"
                    : "border-[#D9E2D8] bg-white hover:border-[#C49A32]"
                }`}
              >
                <span className="text-3xl">{option.icon}</span>
                <h2 className="mt-3 text-lg font-extrabold text-[#173B2B]">
                  {option.name} Booking
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#647468]">
                  {option.description}
                </p>
                {transport === option.id && (
                  <span className="mt-3 inline-flex rounded-full bg-[#173B2B] px-3 py-1 text-xs font-bold text-[#F3D77C]">
                    Selected
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="mb-6 mt-9">
            <h2 className="text-2xl font-black text-[#173B2B]">
              Find Your Journey
            </h2>
            <p className="mt-2 text-sm text-[#647468]">
              Select your travel details to get started.
            </p>
          </div>

          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  Departure City
                </span>
                <select
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                  className="w-full rounded-xl border border-[#D9E2D8] bg-white p-4 text-[#10271D] outline-none focus:border-[#C49A32]"
                >
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={swapCities}
                aria-label="Swap departure and destination"
                className="rounded-full border border-[#D4AF37] px-5 py-3 text-xl font-bold text-[#85631B] transition hover:bg-[#F7F0D9]"
              >
                ⇄
              </button>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  Destination City
                </span>
                <select
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                  className="w-full rounded-xl border border-[#D9E2D8] bg-white p-4 text-[#10271D] outline-none focus:border-[#C49A32]"
                >
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  Travel Date
                </span>
                <input
                  type="date"
                  value={date}
                  min={new Date().toLocaleDateString("en-CA")}
                  onChange={(event) => setDate(event.target.value)}
                  required
                  className="w-full rounded-xl border border-[#D9E2D8] bg-white p-4 outline-none focus:border-[#C49A32]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold">
                  Passengers
                </span>
                <select
                  value={passengers}
                  onChange={(event) => setPassengers(event.target.value)}
                  className="w-full rounded-xl border border-[#D9E2D8] bg-white p-4 outline-none focus:border-[#C49A32]"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                    <option key={number} value={number}>
                      {number} {number === 1 ? "Passenger" : "Passengers"}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {message && (
              <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
                {message}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-full bg-[#173B2B] px-6 py-4 text-sm font-bold text-[#F3D77C] transition hover:bg-[#10271D]"
            >
              Search {transport === "bus" ? "Buses" : transport === "train" ? "Trains" : "Flights"}
            </button>
          </form>

          {searchDetails && (
            <div className="mt-6 rounded-2xl border border-[#D9E2D8] bg-[#F3F6F1] p-5">
              <h3 className="font-extrabold text-[#173B2B]">
                Your Search Details
              </h3>
              <p className="mt-2 text-sm leading-7 text-[#647468]">
                {searchDetails}
              </p>
              <p className="mt-3 text-xs leading-6 text-[#85631B]">
                Live schedules, fares and seat availability will be connected
                after operator and booking-provider integration.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A17C26]">
            EXPLORE ALIQO
          </p>
          <h2 className="mt-3 text-3xl font-black text-[#173B2B]">
            Travel Made Convenient
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {options.map((option) => (
            <article
              key={option.id}
              className="rounded-3xl border border-[#D9E2D8] bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-[#C49A32] hover:shadow-xl"
            >
              <span className="text-4xl">{option.icon}</span>
              <h3 className="mt-5 text-xl font-extrabold text-[#173B2B]">
                {option.name} Travel
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#647468]">
                {option.description}.
              </p>
              <button
                type="button"
                onClick={() => {
                  setTransport(option.id);
                  setSearchDetails("");
                  setMessage("");
                  window.scrollTo({ top: 300, behavior: "smooth" });
                }}
                className="mt-5 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#10271D] transition hover:bg-[#E4C35D]"
              >
                Select {option.name}
              </button>
            </article>
          ))}
        </div>
      </section>

      <footer className="bg-[#090F0B] px-5 py-8 text-center text-sm text-[#A9B7AA]">
        © 2026 ALIQO. All rights reserved.
      </footer>
    </main>
  );
}
