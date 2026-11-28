
import HotelDetailsClient from "./HotelDetailsClient";

type HotelDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function HotelDetailsPage({
  params,
}: HotelDetailsPageProps) {
  const { id } = await params;

  return <HotelDetailsClient hotelId={id} />;
}
