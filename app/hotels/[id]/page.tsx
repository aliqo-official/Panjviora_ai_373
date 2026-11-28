
import { Suspense } from "react";
import HotelDetailsClient from "./HotelDetailsClient";

// Allow this route to render at request time.
export const instant = false;

type HotelDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function HotelDetailsContent({
  params,
}: HotelDetailsPageProps) {
  const { id } = await params;

  return <HotelDetailsClient hotelId={id} />;
}

function LoadingHotelDetails() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#061b15] px-4 text-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#d6b45b] border-t-transparent" />
        <p className="text-[#d6b45b]">Loading hotel details...</p>
      </div>
    </main>
  );
}

export default function HotelDetailsPage({
  params,
}: HotelDetailsPageProps) {
  return (
    <Suspense fallback={<LoadingHotelDetails />}>
      <HotelDetailsContent params={params} />
    </Suspense>
  );
}
