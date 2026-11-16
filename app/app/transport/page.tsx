
"use client";

import { useState } from "react";

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

const transportOptions = [
  { id: "bus", name: "Bus", icon: "🚌", description: "Explore bus routes across Pakistan" },
  { id: "train", name: "Train", icon: "🚆", description: "Explore railway journeys" },
  { id: "airline", name: "Airline", icon: "✈️", description: "Explore domestic and international flights" },
] as const;

export default function TransportPage() {
  const [transport, setTransport] = useState<TransportType>("bus");
  const [from, setFrom] = useState("Karachi");
  const [to, setTo] = useState("Lahore");
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState("1");
  const [message, setMessage] = useState("");

  function swapCities() {
    setFrom(to);
    setTo(from);
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!from || !to || !date) {
      setMessage("Please select your departure city, destination and travel date.");
      return;
    }

    if (from === to) {
      setMessage("Departure and destination cities must be different.");
      return;
    }

    const selectedDate = new Date(`${date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setMessage("Please select today or a future travel date.");
      return;
    }

    const params = new URLSearchParams({
      type: transport,
      from,
      to,
      date,
      passengers,
    });

    window.location.href = `/transport/search?${params.toString()}`;
  }

  return (
    <main className="min-h-screen bg-[#f7faf7] text-gray-900">
      <header className="bg-[#073b2a] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <a href="/" className="text-3xl font-extrabold tracking-wide">
            ALIQO<span className="text-[#d5ad45]">.</span>
          </a>

          <nav className="flex items-center gap-5 text-sm font-medium">
            <a href="/" className="hover:text-[#e5c36a]">Home</a>
            <a href="/marketplace" className="hover:text-[#e5c36a]">Marketplace</a>
            <a href="/contact" className="hover:text-[#e5c36a]">Contact</a>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-br from-[#073b2a] to-[#126044] px-5 py-16 text-center text-white">
        <p className="mb-3 font-semibold uppercase tracking-[0.25em] text-[#e5c36a]">
          ALIQO Travel
        </p>

        <h1 className="text-4xl font-extrabold md:text-5xl">
          Your Journey Starts Here
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-base text-green-100 md:text-lg">
          Explore bus, train and airline travel options from one convenient platform.
        </p>
      </section>

      <section className="mx-auto -mt-8 max-w-6xl px-4 pb-16">
        <div className="rounded-2xl bg-white p-5 shadow-xl md:p-8">
          <div className="mb-7 grid grid-cols-3 gap-3">
            {transportOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setTransport(option.id);
                  setMessage("");
                }}
                className={`rounded-xl border-2 p-4 text-center transition ${
                  transport === option.id
                    ? "border-[#0b6849] bg-[#eaf5ee] text-[#075638]"
                    : "border-gray-200 hover:border-[#0b6849]"
                }`}
              >
                <span className="block text-3xl">{option.icon}</span>
                <span className="mt-2 block font-bold">{option.name}</span>
                <span className="mt-1 hidden text-xs text-gray-500 md:block">
                  {option.description}
                </span>
              </button>
            ))}
          </div>

          <h2 className="mb-5 text-2xl font-bold text-[#073b2a]">
            Search Your Journey
          </h2>

          <form onSubmit={handleSearch} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">From</span>
                <select
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white p-4 outline-none focus:border-[#0b6849]"
                >
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={swapCities}
                aria-label="Swap departure and destination"
                className="rounded-xl border border-[#d5ad45] px-5 py-3 text-xl text-[#806116] hover:bg-yellow-50"
              >
                ⇄
              </button>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">To</span>
                <select
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white p-4 outline-none focus:border-[#0b6849]"
                >
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Travel Date</span>
                <input
                  type="date"
                  value={date}
                  min={new Date().toLocaleDateString("en-CA")}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-[#0b6849]"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Passengers</span>
                <select
                  value={passengers}
                  onChange={(e) => setPassengers(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white p-4 outline-none focus:border-[#0b6849]"
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
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {message}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-[#0b6849] px-6 py-4 text-lg font-bold text-white transition hover:bg-[#084d36]"
            >
              Search {transport === "airline" ? "Flights" : transport === "train" ? "Trains" : "Buses"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-500">
            Search interface preview. Live schedules, prices and seat availability will appear after provider integration.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="mb-6 text-center text-2xl font-bold text-[#073b2a]">
          Travel With ALIQO
        </h2>

        <div className="grid gap-5 md:grid-cols-3">
          {transportOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setTransport(option.id);
                window.scrollTo({ top: 300, behavior: "smooth" });
              }}
              className="rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="text-4xl">{option.icon}</span>
              <h3 className="mt-4 text-xl font-bold text-[#073b2a]">
                {option.name} Booking
              </h3>
              <p className="mt-2 text-sm text-gray-600">{option.description}</p>
            </button>
          ))}
        </div>
      </section>

      <footer className="bg-[#073b2a] px-5 py-8 text-center text-sm text-green-100">
        © {new Date().getFullYear()} ALIQO. All rights reserved.
        <p className="mt-2 text-[#e5c36a]">Your World, One Platform.</p>
      </footer>
    </main>
  );
}
