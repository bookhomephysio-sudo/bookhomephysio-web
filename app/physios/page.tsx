import { supabase } from "@/lib/supabase";
import AreaFilter from "./area-filter";

export const dynamic = "force-dynamic";

export default async function PhysiosPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string }>;
}) {
  const { area } = await searchParams;

  const { data: areas } = await supabase.from("areas").select("*").order("name");

  let ids: string[] | null = null;
  let areaName = "";
  if (area) {
    const { data: sa } = await supabase
      .from("service_areas").select("physio_id").eq("area_id", area);
    ids = (sa ?? []).map((r: any) => r.physio_id);
    areaName = (areas ?? []).find((a: any) => a.id === area)?.name ?? "";
  }

  let query = supabase
    .from("profiles")
    .select("id, full_name, bio, avatar_url, qualifications, experience_years, hourly_rate, rating, services(name, price, duration_minutes), reviews!reviews_physio_id_fkey(rating)")
    .eq("role", "physio")
    .eq("kyc_status", "approved");
  if (ids) query = ids.length ? query.in("id", ids) : query.in("id", ["00000000-0000-0000-0000-000000000000"]);
  const { data: physios } = await query.order("rating", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-bold text-slate-900">Find Your Home Physiotherapist</h1>
      <p className="mt-1 text-slate-600">Verified professionals, at your doorstep.</p>

      <div className="mt-5 max-w-sm">
        <label className="text-sm font-medium text-slate-700">Your location</label>
        <AreaFilter areas={areas ?? []} current={area ?? null} />
      </div>

      {areaName && (
        <p className="mt-4 text-sm text-slate-600">
          Showing physios serving <b>{areaName}</b>
        </p>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(physios ?? []).map((p: any) => (
          <div key={p.id} className="rounded-2xl bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt={p.full_name} className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-100 font-semibold text-teal-700">{p.full_name?.[0]}</div>
                )}
                <h2 className="text-lg font-semibold text-slate-900">{p.full_name}</h2>
              </div>
              <span className="text-sm font-medium text-amber-500">★ {Number(p.rating).toFixed(1)} ({p.reviews?.length ?? 0})</span>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {p.qualifications}{p.experience_years ? ` · ${p.experience_years} yrs exp` : ""}
            </p>
            <p className="mt-2 text-sm text-slate-600">{p.bio}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(p.services ?? []).map((s: any, i: number) => (
                <span key={i} className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
                  {s.name} · {s.duration_minutes} min
                </span>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="font-semibold text-slate-900">₹{p.hourly_rate}/session</span>
              <a href={`/book/${p.id}`} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">Book Now</a>
            </div>
          </div>
        ))}
      </div>

      {(physios ?? []).length === 0 && (
        <p className="mt-8 text-slate-500">
          No physios serve this area yet — we're expanding fast! Try "All areas".
        </p>
      )}
    </main>
  );
}