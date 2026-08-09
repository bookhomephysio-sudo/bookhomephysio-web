"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function BookingForm({ physioId, services, areas, packages }: {
  physioId: string;
  services: any[];
  areas: any[];
  packages: any[];
}) {
  const [serviceId, setServiceId] = useState<string>(services[0]?.id ?? "");
  const [packageId, setPackageId] = useState<string>("");
  const [areaId, setAreaId] = useState<string>(areas[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const service = services.find((s) => s.id === serviceId);
  const area = areas.find((a) => a.id === areaId);
  const pkg = packages.find((p) => p.id === packageId);
  const amount = pkg ? Number(pkg.price) : Number(service?.price ?? 0) + Number(area?.extra_charge ?? 0);
  const today = new Date().toISOString().slice(0, 10);

  // Auto-fill phone & address from the patient's saved profile
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: prof } = await supabase
        .from("profiles").select("phone, address").eq("id", session.user.id).single();
      if (prof?.phone) setPhone(prof.phone);
      if (prof?.address) setAddress(prof.address);
    })();
  }, []);

  useEffect(() => {
    if (!date || !service) { setSlots([]); setSlot(null); return; }
    (async () => {
      setSlotsLoading(true);
      const day = new Date(date + "T12:00:00").getDay();
      const { data: hours } = await supabase
        .from("availability")
        .select("start_time, end_time")
        .eq("physio_id", physioId)
        .eq("day_of_week", day);
      const { data: taken } = await supabase.rpc("taken_slots", { p_physio: physioId, p_day: date });

      const busy = (taken ?? []).map((t: any) => ({
        s: new Date(t.start_time).getTime(),
        e: new Date(t.end_time ?? t.start_time).getTime(),
      }));

      const out: string[] = [];
      const dur = Number(service.duration_minutes) || 60;
      for (const h of hours ?? []) {
        const [sh, sm] = h.start_time.split(":").map(Number);
        const [eh, em] = h.end_time.split(":").map(Number);
        let cur = sh * 60 + sm;
        const endMin = eh * 60 + em;
        while (cur + dur <= endMin) {
          const start = new Date(date + "T00:00:00");
          start.setHours(Math.floor(cur / 60), cur % 60, 0, 0);
          const s = start.getTime();
          const e = s + dur * 60000;
          const clash = busy.some((b: any) => s < b.e && e > b.s);
          if (!clash && s > Date.now()) {
            out.push(`${String(Math.floor(cur / 60)).padStart(2, "0")}:${String(cur % 60).padStart(2, "0")}`);
          }
          cur += dur;
        }
      }
      setSlots(out);
      setSlot(null);
      setSlotsLoading(false);
    })();
  }, [date, serviceId, physioId]);

  const submit = async () => {
    if (!slot) return setError("Please pick a time slot.");
    if (!address.trim()) return setError("Please enter your full address.");
    if (!phone.trim()) return setError("Please enter your phone number.");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return setError("Please log in first.");
    setError("");
    setSaving(true);
    const start = new Date(date + "T00:00:00");
    const [sh, sm] = slot.split(":").map(Number);
    start.setHours(sh, sm, 0, 0);
    const dur = Number(service?.duration_minutes) || 60;
    const end = new Date(start.getTime() + dur * 60000);

    const { error: err } = await supabase.from("bookings").insert({
      patient_id: session.user.id,
      physio_id: physioId,
      service_id: serviceId || null,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      status: "pending_acceptance",
      amount,
      patient_address: { full_address: address.trim() },
      patient_phone: phone.trim(),
      service_area_id: areaId || null,
      package_id: packageId || null,
    });
    setSaving(false);
    if (err) setError(err.message);
    else setDone(true);
  };

  if (services.length === 0) {
    return <p className="mt-6 text-slate-500">This physio hasn't published treatments yet.</p>;
  }

  if (done) {
    return (
      <div className="mt-6 max-w-lg rounded-2xl bg-green-50 p-6 text-green-800">
        ✅ Booking request sent! Track it under <b>My Bookings</b>.
      </div>
    );
  }

  return (
    <div className="mt-6 max-w-lg space-y-5 rounded-2xl bg-white p-6 shadow">
      <div>
        <label className="text-sm font-medium text-slate-700">Treatment</label>
        <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.name} · {s.duration_minutes} min · ₹{s.price}</option>
          ))}
        </select>
      </div>

      {packages.length > 0 && (
        <div>
          <label className="text-sm font-medium text-slate-700">Session or package?</label>
          <div className="mt-1 space-y-2">
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <input type="radio" checked={!packageId} onChange={() => setPackageId("")} />
              Single session
            </label>
            {packages.map((p) => (
              <label key={p.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <input type="radio" checked={packageId === p.id} onChange={() => setPackageId(p.id)} />
                {p.name} · {p.sessions} sessions in {p.days} days · ₹{p.price}
              </label>
            ))}
          </div>
        </div>
      )}

      {areas.length > 0 && (
        <div>
          <label className="text-sm font-medium text-slate-700">Your area</label>
          <select value={areaId} onChange={(e) => setAreaId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.area_name}{Number(a.extra_charge) > 0 ? ` (+₹${a.extra_charge})` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-slate-700">Date</label>
        <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>

      {date && (
        <div>
          <label className="text-sm font-medium text-slate-700">Available slots</label>
          {slotsLoading ? (
            <p className="mt-1 text-sm text-slate-500">Checking availability…</p>
          ) : slots.length === 0 ? (
            <p className="mt-1 text-sm text-slate-500">No free slots this day — try another date.</p>
          ) : (
            <div className="mt-1 flex flex-wrap gap-2">
              {slots.map((t) => (
                <button key={t} onClick={() => setSlot(t)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${slot === t ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-slate-700">Your phone number</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="+91…"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Full address</label>
        <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)}
          placeholder="House no, street, sector, city"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>

      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-900">Total: ₹{amount}</span>
        <button onClick={submit} disabled={saving}
          className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
          {saving ? "Booking…" : "Confirm booking"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}