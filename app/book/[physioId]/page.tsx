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
    .select("id, full_name, bio, services(id, name, price, duration_minutes)")
    .eq("id", physioId)
    .single();

  if (!physio) return <main className="p-8 text-slate-600">Physio not found.</main>;

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-bold text-slate-900">Book {physio.full_name}</h1>
      <p className="mt-1 text-slate-600">{physio.bio}</p>
      <BookingForm physioId={physio.id} services={physio.services} />
    </main>
  );
}