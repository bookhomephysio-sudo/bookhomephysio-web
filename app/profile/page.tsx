"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const [uid, setUid] = useState<string | null>(null);
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addr, setAddr] = useState("");
  const [areaId, setAreaId] = useState("");
  const [areas, setAreas] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUid(session.user.id);
      const [prof, ar] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", session.user.id).single(),
        supabase.from("areas").select("*").order("name"),
      ]);
      setRole(prof.data?.role ?? "");
      setName(prof.data?.full_name ?? "");
      setPhone(prof.data?.phone ?? "");
      setAddr(prof.data?.address ?? "");
      setAreaId(prof.data?.area_id ?? "");
      setAreas(ar.data ?? []);
    })();
  }, []);

  const save = async () => {
    const { error } = await supabase.from("profiles").update({
      full_name: role === "patient" ? name : undefined,
      phone: phone.trim(),
      address: addr.trim(),
      area_id: areaId || null,
    }).eq("id", uid);
    setMsg(error ? error.message : "✅ Saved — bookings will auto-fill these details.");
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-bold text-slate-900">My profile</h1>
        <p className="mt-1 text-slate-600">Saved once, auto-filled in every booking.</p>

        <div className="mt-8 space-y-5 rounded-2xl bg-white p-6 shadow">
          <div>
            <label className="text-sm font-medium text-slate-700">Full name</label>
            {role === "patient" ? (
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            ) : (
              <p className="mt-1 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-500">🔒 {name} — verified identity</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="+91…"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Home area</label>
            <select value={areaId} onChange={(e) => setAreaId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="">Select…</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Default address</label>
            <textarea rows={2} value={addr} onChange={(e) => setAddr(e.target.value)}
              placeholder="House no, street, sector, city"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <button onClick={save} className="w-full rounded-lg bg-teal-600 py-2.5 font-semibold text-white hover:bg-teal-700">
            Save profile
          </button>
          {msg && <p className="text-center text-sm text-slate-600">{msg}</p>}
        </div>
      </div>
    </main>
  );
}