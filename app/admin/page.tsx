"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [physios, setPhysios] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [newArea, setNewArea] = useState("");
  const [newCity, setNewCity] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "physio")
      .in("kyc_status", ["pending", "submitted", "rejected"]);
    setPhysios(data ?? []);
    setLoaded(true);
  };

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: prof } = await supabase
        .from("profiles").select("role").eq("id", session.user.id).single();
      if (prof?.role !== "admin") return;
      setIsAdmin(true);
      await load();
    })();
  }, []);

  const openDoc = async (path: string) => {
    const { data, error } = await supabase.storage.from("kyc").createSignedUrl(path, 3600);
    if (error) return alert(error.message);
    window.open(data.signedUrl, "_blank");
  };

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("profiles").update({ kyc_status: status }).eq("id", id);
    if (error) return alert(error.message);
    await load();
  };

  const addArea = async () => {
    if (!newArea || !newCity) return alert("Area name and city required");
    const { error } = await supabase.from("areas").insert({ name: newArea, city: newCity });
    if (error) return alert(error.message);
    setNewArea(""); setNewCity("");
  };

  if (!isAdmin) return <main className="min-h-screen bg-slate-50 p-8 text-slate-600">Admins only.</main>;

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-bold text-slate-900">KYC approvals</h1>
      <p className="mt-1 text-slate-600">Review documents → approve or reject. Approved physios go live instantly.</p>

      <div className="mt-8 max-w-3xl space-y-6">
        {loaded && physios.length === 0 && <p className="text-slate-500">No applications waiting. 🎉</p>}
        {physios.map((p) => (
          <div key={p.id} className="rounded-2xl bg-white p-6 shadow">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 font-semibold text-teal-700">{p.full_name?.[0]}</div>
                )}
                <div>
                  <h2 className="font-semibold text-slate-900">{p.full_name}</h2>
                  <p className="text-sm text-slate-600">
                    {p.qualifications}{p.experience_years ? ` · ${p.experience_years} yrs` : ""} · ₹{p.hourly_rate}/session
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    📞 {p.phone} · 🏠 {p.city}
                    {p.requested_city ? (
                      <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        NEW CITY REQUEST: {p.requested_city}
                      </span>
                    ) : ""}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{p.bio}</p>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                p.kyc_status === "submitted" ? "bg-blue-100 text-blue-700"
                : p.kyc_status === "rejected" ? "bg-red-100 text-red-700"
                : "bg-amber-100 text-amber-700"}`}>
                {p.kyc_status}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {p.kyc_id_url && (
                <button onClick={() => openDoc(p.kyc_id_url)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200">🪪 Govt ID</button>
              )}
              {p.kyc_cert_url && (
                <button onClick={() => openDoc(p.kyc_cert_url)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200">🎓 Certificate</button>
              )}
              <div className="flex-1" />
              <button onClick={() => setStatus(p.id, "rejected")} className="rounded-lg bg-red-100 px-4 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-200">Reject</button>
              <button onClick={() => setStatus(p.id, "approved")} className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-green-700">Approve ✅</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 max-w-3xl rounded-2xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-slate-900">Expand to a new area</h2>
        <p className="mt-1 text-sm text-slate-600">
          When a physio requests a new city, add it here — it instantly becomes selectable in their My Practice page.
        </p>
        <div className="mt-4 flex gap-2">
          <input value={newArea} onChange={(e) => setNewArea(e.target.value)} placeholder="Area, e.g. Saket, New Delhi"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="City"
            className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button onClick={addArea} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Add area</button>
        </div>
      </div>
    </main>
  );
}