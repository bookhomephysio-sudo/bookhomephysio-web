"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function PracticePage() {
  const [physioId, setPhysioId] = useState<string | null>(null);
  const [isPhysio, setIsPhysio] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [hours, setHours] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);

  const [sName, setSName] = useState("");
  const [sPrice, setSPrice] = useState("");
  const [sMin, setSMin] = useState("40");
  const [catalog, setCatalog] = useState<any[]>([]);
  const [aId, setAId] = useState("");
  const [aCharge, setACharge] = useState("0");
  const [hDay, setHDay] = useState(1);
  const [hStart, setHStart] = useState("08:00");
  const [hEnd, setHEnd] = useState("12:00");
  const [pName, setPName] = useState("");
  const [pSessions, setPSessions] = useState("10");
  const [pDays, setPDays] = useState("10");
  const [pPrice, setPPrice] = useState("");
  const [pDesc, setPDesc] = useState("");

  const load = async (pid: string) => {
    const [sv, ar, hr, pk, ct] = await Promise.all([
      supabase.from("services").select("*").eq("physio_id", pid).order("price"),
      supabase.from("service_areas").select("*").eq("physio_id", pid),
      supabase.from("availability").select("*").eq("physio_id", pid).order("day_of_week").order("start_time"),
      supabase.from("packages").select("*").eq("physio_id", pid),
      supabase.from("areas").select("*").order("name"),
    ]);
    setServices(sv.data ?? []);
    setAreas(ar.data ?? []);
    setHours(hr.data ?? []);
    setPackages(pk.data ?? []);
    setCatalog(ct.data ?? []);
    setAId((prev) => prev || ct.data?.[0]?.id || "");
  };

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: prof } = await supabase
        .from("profiles").select("role").eq("id", session.user.id).single();
      if (prof?.role === "physio") {
        setIsPhysio(true);
        setPhysioId(session.user.id);
        await load(session.user.id);
      }
    })();
  }, []);

  const addService = async () => {
    if (!sName || !sPrice) return alert("Treatment name and price are required");
    const { error } = await supabase.from("services").insert({
      physio_id: physioId, name: sName, price: Number(sPrice), duration_minutes: Number(sMin),
    });
    if (error) return alert(error.message);
    setSName(""); setSPrice(""); setSMin("40");
    await load(physioId!);
  };

  const addArea = async () => {
    const chosen = catalog.find((c) => c.id === aId);
    if (!chosen) return alert("Pick an area");
    const { error } = await supabase.from("service_areas").insert({
      physio_id: physioId, area_id: aId, area_name: chosen.name, extra_charge: Number(aCharge),
    });
    if (error) return alert(error.message);
    setACharge("0");
    await load(physioId!);
  };

  const addHours = async () => {
    const { error } = await supabase.from("availability").insert({
      physio_id: physioId, day_of_week: hDay, start_time: hStart, end_time: hEnd,
    });
    if (error) return alert(error.message);
    await load(physioId!);
  };

  const addPackage = async () => {
    if (!pName || !pPrice) return alert("Package name and price are required");
    const { error } = await supabase.from("packages").insert({
      physio_id: physioId, name: pName, sessions: Number(pSessions), days: Number(pDays),
      price: Number(pPrice), description: pDesc,
    });
    if (error) return alert(error.message);
    setPName(""); setPPrice(""); setPDesc("");
    await load(physioId!);
  };

  const del = async (table: string, id: string) => {
    if (!confirm("Delete this?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return alert(error.message);
    await load(physioId!);
  };

  if (!isPhysio) {
    return <main className="min-h-screen bg-slate-50 p-8 text-slate-600">Log in with a physio account to manage your practice.</main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-bold text-slate-900">My Practice</h1>
      <p className="mt-1 text-slate-600">Your treatments, rates, areas, weekly hours and packages.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-slate-900">Treatments & rates</h2>
          <div className="mt-4 space-y-2">
            {services.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2 text-sm">
                <span className="text-slate-700">{s.name} · min {s.duration_minutes} min · ₹{s.price}</span>
                <button onClick={() => del("services", s.id)} className="text-red-500 hover:underline">Delete</button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <input value={sName} onChange={(e) => setSName(e.target.value)} placeholder="Treatment name"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input value={sPrice} onChange={(e) => setSPrice(e.target.value)} type="number" placeholder="₹"
              className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input value={sMin} onChange={(e) => setSMin(e.target.value)} type="number" placeholder="min"
              className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <button onClick={addService} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">Add</button>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-slate-900">Areas you serve</h2>
          <div className="mt-4 space-y-2">
            {areas.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2 text-sm">
                <span className="text-slate-700">{a.area_name} {Number(a.extra_charge) > 0 ? `· +₹${a.extra_charge}` : ""}</span>
                <button onClick={() => del("service_areas", a.id)} className="text-red-500 hover:underline">Delete</button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <select value={aId} onChange={(e) => setAId(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
              {catalog.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input value={aCharge} onChange={(e) => setACharge(e.target.value)} type="number" placeholder="+₹"
              className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <button onClick={addArea} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">Add</button>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-slate-900">Weekly working hours</h2>
          <div className="mt-4 space-y-2">
            {hours.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2 text-sm">
                <span className="text-slate-700">{DAYS[h.day_of_week]} · {h.start_time.slice(0, 5)} – {h.end_time.slice(0, 5)}</span>
                <button onClick={() => del("availability", h.id)} className="text-red-500 hover:underline">Delete</button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <select value={hDay} onChange={(e) => setHDay(Number(e.target.value))}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
            <input type="time" value={hStart} onChange={(e) => setHStart(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input type="time" value={hEnd} onChange={(e) => setHEnd(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <button onClick={addHours} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">Add</button>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-slate-900">Recovery packages</h2>
          <div className="mt-4 space-y-2">
            {packages.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2 text-sm">
                <span className="text-slate-700">{p.name} · {p.sessions} sessions / {p.days} days · ₹{p.price}</span>
                <button onClick={() => del("packages", p.id)} className="text-red-500 hover:underline">Delete</button>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="e.g. 10-Day Post-Surgery Rehab"
              className="col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input value={pSessions} onChange={(e) => setPSessions(e.target.value)} type="number" placeholder="Sessions"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input value={pDays} onChange={(e) => setPDays(e.target.value)} type="number" placeholder="Days"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input value={pPrice} onChange={(e) => setPPrice(e.target.value)} type="number" placeholder="Package ₹"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <input value={pDesc} onChange={(e) => setPDesc(e.target.value)} placeholder="Short description"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <button onClick={addPackage} className="col-span-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">Add package</button>
          </div>
        </section>
      </div>
    </main>
  );
}