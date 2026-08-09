import { supabase } from "@/lib/supabase";
import BookingForm from "./booking-form";

export async function generateMetadata({ params }: { params: Promise<{ physioId: string }> }) {
  const { physioId } = await params;
  const { data } = await supabase
    .from("profiles").select("full_name, bio, qualifications")
    .eq("id", physioId).single();
  return {
    title: `Book ${data?.full_name ?? "a Physiotherapist"} — Home Visit Physiotherapy`,
    description: data?.bio ?? "Book a verified home-visit physiotherapist.",
  };
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ physioId: string }>;
}) {
  const { physioId } = await params;

  const { data: physio } = await supabase
    .from("profiles")
    .select("id, full_name, bio, avatar_url, qualifications, experience_years, hourly_rate, services(id, name, price, duration_minutes), service_areas(id, area_name, extra_charge), packages(id, name, sessions, days, price, description), reviews!reviews_physio_id_fkey(rating, comment, created_at)")
    .eq("id", physioId)
    .single();

  if (!physio) return <main className="p-8 text-slate-600">Physio not found.</main>;

  const reviews = physio.reviews ?? [];
  const avg = reviews.length
    ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: physio.full_name,
    description: physio.bio,
    image: physio.avatar_url ?? undefined,
    priceRange: `₹${physio.hourly_rate}`,
    areaServed: (physio.service_areas ?? []).map((a: any) => a.area_name),
    ...(avg
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: Number(avg), reviewCount: reviews.length } }
      : {}),
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="flex items-center gap-4">
        {physio.avatar_url && <img src={physio.avatar_url} alt="" className="h-14 w-14 rounded-full object-cover" />}
        <h1 className="text-3xl font-bold text-slate-900">Book {physio.full_name}</h1>
      </div>
      <p className="mt-1 text-sm font-medium text-slate-500">{physio.qualifications}{physio.experience_years ? ` · ${physio.experience_years} yrs experience` : ""}</p>
      <p className="mt-1 text-slate-600">{physio.bio}</p>
      <BookingForm physioId={physio.id} services={physio.services} areas={physio.service_areas} packages={physio.packages} />

      {(physio.reviews ?? []).length > 0 && (
        <section className="mt-10 max-w-lg">
          <h2 className="text-xl font-bold text-slate-900">Patient reviews</h2>
          <div className="mt-4 space-y-4">
            {physio.reviews.map((r: any, i: number) => (
              <div key={i} className="rounded-2xl bg-white p-5 shadow">
                <span className="text-amber-400">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                <p className="mt-1 text-sm text-slate-600">{r.comment || `Rated ${r.rating} stars.`}</p>
                <p className="mt-1 text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}