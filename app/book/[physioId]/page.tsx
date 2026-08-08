import { supabase } from "@/lib/supabase";
import BookingForm from "./booking-form";

export default async function BookPage({
  params,
}: {
  params: Promise<{ physioId: string }>;
}) {
  const { physioId } = await params;

  const { data: physio } = await supabase
    .from("profiles")
    .select("id, full_name, bio, services(id, name, price, duration_minutes), service_areas(id, area_name, extra_charge), packages(id, name, sessions, days, price, description), reviews!reviews_physio_id_fkey(rating, comment, created_at)")
    .eq("id", physioId)
    .single();

  if (!physio) return <main className="p-8 text-slate-600">Physio not found.</main>;

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-bold text-slate-900">Book {physio.full_name}</h1>
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