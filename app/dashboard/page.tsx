"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const STATUS_COLORS: Record<string, string> = {
  payment_pending: "bg-amber-100 text-amber-700",
  pending_acceptance: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  en_route: "bg-purple-100 text-purple-700",
  in_session: "bg-indigo-100 text-indigo-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-slate-200 text-slate-600",
  refunded: "bg-slate-200 text-slate-600",
  disputed: "bg-red-100 text-red-700",
};

const NEXT_ACTION: Record<string, { label: string; next: string }> = {
  confirmed: { label: "🚗 Start Travel", next: "en_route" },
  en_route: { label: "🏠 Check In & Start Session", next: "in_session" },
  in_session: { label: "✅ Mark Completed", next: "completed" },
};

export default function DashboardPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [physioId, setPhysioId] = useState<string | null>(null);

  const load = async (uid: string) => {
    const { data } = await supabase
      .from("bookings")
      .select("id, start_time, status, amount, patient_notes, patient_address, profiles!bookings_patient_id_fkey(full_name), services(name)")
      .eq("physio_id", uid)
      .order("start_time");
    setBookings(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }
      setPhysioId(session.user.id);
      await load(session.user.id);
    })();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (!error && physioId) await load(physioId);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-bold text-slate-900">Physio Dashboard</h1>
      <p className="mt-1 text-slate-600">Manage your home-visit bookings.</p>

      {loading ? (
        <p className="mt-6 text-slate-500">Loading...</p>
      ) : bookings.length === 0 ? (
        <p className="mt-6 text-slate-500">No bookings yet.</p>
      ) : (
        <div className="mt-6 max-w-3xl space-y-4">
          {bookings.map((b: any) => (
            <div key={b.id} className="rounded-2xl bg-white p-5 shadow">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">
                  {b.profiles?.full_name}
                  <span className="text-sm font-normal text-slate-500"> · {b.services?.name}</span>
                </h2>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[b.status] ?? "bg-slate-200 text-slate-600"}`}>
                  {b.status.replace(/_/g, " ")}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{new Date(b.start_time).toLocaleString()} · ₹{b.amount}</p>
              <p className="mt-1 text-sm text-slate-500">📍 {b.patient_address?.full_address}</p>
              {b.patient_notes && <p className="mt-1 text-sm text-slate-500">📝 {b.patient_notes}</p>}

              <div className="mt-3 flex gap-2">
                {b.status === "pending_acceptance" && (
                  <>
                    <button onClick={() => updateStatus(b.id, "confirmed")}
                      className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">
                      Accept
                    </button>
                    <button onClick={() => updateStatus(b.id, "cancelled")}
                      className="rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-200">
                      Decline
                    </button>
                  </>
                )}
                {NEXT_ACTION[b.status] && (
                  <button onClick={() => updateStatus(b.id, NEXT_ACTION[b.status].next)}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                    {NEXT_ACTION[b.status].label}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}