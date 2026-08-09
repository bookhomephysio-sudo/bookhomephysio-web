import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const nice = decodeURIComponent(city).replace(/-/g, " ");
  return {
    title: `Home Physiotherapists in ${nice} — Book Verified Physios`,
    description: `Book verified home-visit physiotherapists in ${nice}. Transparent pricing, real patient reviews, doorstep service.`,
  };
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const nice = decodeURIComponent(city).replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

  const { data: areas } = await supabase.from("areas").select("*").ilike("city", nice);
  const areaIds = (areas ?? []).map((a: any) => a.id);
  let physios: any[] = [];
  if (areaIds.length) {
    const { data: sa } = await supabase.from("service_areas").select("physio_id").in("area_id", areaIds);
    const ids = Array.from(new Set((sa ?? []).map((r: any) => r.physio_id)));
    if (ids.length) {
      const { data: ps } = await supabase
        .from("profiles")
        .select("id, full_name, bio, avatar_url, qualifications, experience_years, hourly_rate, rating, services(name, duration_minutes)")
        .in("id", ids).eq("role", "physio").eq("kyc_status", "approved");
      physios = ps ?? [];
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-bold text-slate-900">Home Physiotherapists in {nice}</h1>
      <p className="mt-2 max-w-2xl text-slate-600">
        Verified physiotherapists for home visits in {nice} — post-surgery recovery, sports injuries, back pain, sciatica and more. Book online, recover where you feel safest.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {physios.map((p) => (
          <div key={p.id} className="rounded-2xl bg-white p-6 shadow">
            <div className="flex items-center gap-3">
              {p.avatar_url ? (
                <img src={p.avatar_url} alt={p.full_name} className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-100 font-semibold text-teal-700">{p.full_name?.[0]}</div>
              )}
              <h2 className="text-lg font-semibold text-slate-900">{p.full_name}</h2>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {p.qualifications}{p.experience_years ? ` · ${p.experience_years} yrs exp` : ""}
            </p>
            <p className="mt-2 text-sm text-slate-600">{p.bio}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="font-semibold text-slate-900">₹{p.hourly_rate}/session</span>
              <a href={`/book/${p.id}`} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">Book Now</a>
            </div>
          </div>
        ))}
      </div>

      {physios.length === 0 && (
        <p className="mt-8 text-slate-500">
          No physios in {nice} yet — <a href="/physios" className="font-medium text-teal-700 hover:underline">browse all areas</a>.
        </p>
      )}
    </main>
  );
}