"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const TIME_SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

export default function BookingForm({ physioId, services }: { physioId: string; services: any[] }) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState(TIME_SLOTS[0]);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert("Please log in first!");
      router.push("/auth");
      return;
    }

    const service = services.find((s) => s.id === serviceId);
    const start = new Date(`${date}T${time}:00`);
    const end = new Date(start.getTime() + (service?.duration_minutes ?? 60) * 60000);

    const { error } = await supabase.from("bookings").insert({
      patient_id: session.user.id,
      physio_id: physioId,
      service_id: serviceId,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      patient_address: { full_address: address },
      patient_notes: notes,
      status: "pending_acceptance",
      amount: service?.price ?? 0,
    });

    if (error) setError(error.message);
    else setMessage("✅ Booking requested! Track it on the My Bookings page.");
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow">
      <div>
        <label className="text-sm font-medium text-slate-700">Service</label>
        <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.name} — ₹{s.price}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Date</label>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Time</label>
          <select value={time} onChange={(e) => setTime(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
            {TIME_SLOTS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Home address</label>
        <textarea required rows={2} value={address} onChange={(e) => setAddress(e.target.value)}
          placeholder="House no, street, area, city"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Notes for the physio (optional)</label>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Knee pain after tennis, 2 weeks"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
      </div>
          <p className="text-xs text-slate-500">
  💵 Pay directly after your session (cash / UPI). Online payments coming soon.
</p>
      <button type="submit" disabled={loading}
        className="w-full rounded-lg bg-teal-600 py-2 font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
        {loading ? "Booking..." : "Request Booking"}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-600">{message}</p>}
    </form>
  );
}