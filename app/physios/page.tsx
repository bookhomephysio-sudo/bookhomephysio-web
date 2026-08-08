import { supabase } from "@/lib/supabase";

export default async function PhysiosPage() {
  const { data: physios, error } = await supabase
    .from("profiles")
        .select("id, full_name, bio, avatar_url, hourly_rate, rating, qualifications, experience_years, services(name, price, duration_minutes), reviews!reviews_physio_id_fkey(rating)")
    .eq("role", "physio")
    .eq("kyc_status", "approved");

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-bold text-slate-900">Find Your Home Physiotherapist</h1>
      <p className="mt-1 text-slate-600">Verified professionals, at your doorstep.</p>

      {error ? (
        <p className="mt-6 text-red-600">Error: {error.message}</p>
      ) : (physios ?? []).length === 0 ? (
        <p className="mt-6 text-slate-500">No approved physios yet.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                <span className="text-sm text-amber-500">
                  ★ {Number(p.rating).toFixed(1)} ({p.reviews.length})
                </span>
              </div>
              <p className="mt-1 text-xs font-medium text-slate-500">{p.qualifications}{p.experience_years ? ` · ${p.experience_years} yrs exp` : ""}</p>
              <p className="mt-2 text-sm text-slate-600">{p.bio}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {p.services.map((s: any) => (
                  <span key={s.name} className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
                    {s.name} · {s.duration_minutes} min
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-semibold text-slate-900">₹{p.hourly_rate}/session</span>
                <a href={`/book/${p.id}`}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
                  Book Now
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}